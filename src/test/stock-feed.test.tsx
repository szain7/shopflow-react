// @vitest-environment jsdom
import {
  QueryClient,
  QueryClientProvider,
  QueryObserver,
} from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { createApiClient } from '../api/client'
import { subscribeToStock } from '../api/stock-feed'
import { useLiveStock } from '../hooks/useLiveStock'
import { state } from './server'

class TestSocket extends EventTarget {
  static CLOSING = 2
  readyState = 0
  close = vi.fn(() => {
    this.readyState = 3
  })

  frame(data: string) {
    this.dispatchEvent(new MessageEvent('message', { data }))
  }
}

const update = JSON.stringify({
  type: 'stock',
  productId: 'product-0002',
  stock: 0,
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

test('validates frames, backs off on errors, reconciles on reconnect, and removes listeners', () => {
  vi.useFakeTimers()
  const sockets: TestSocket[] = []
  const refresh = vi.fn()
  const stop = subscribeToStock(
    new URL('ws://shopflow.test/mock/stock'),
    refresh,
    () => {
      const socket = new TestSocket()
      sockets.push(socket)
      return socket
    },
  )
  const first = sockets[0]
  if (!first) throw new Error('Expected a connection')

  first.dispatchEvent(new Event('open'))
  expect(refresh).toHaveBeenCalledOnce()
  refresh.mockClear()
  first.frame('bad JSON')
  first.frame(
    JSON.stringify({ type: 'stock', productId: 'product-0002', stock: -1 }),
  )
  expect(refresh).not.toHaveBeenCalled()
  first.frame(update)
  expect(refresh).toHaveBeenCalledTimes(1)
  first.dispatchEvent(new Event('error'))
  expect(first.close).toHaveBeenCalledOnce()

  first.frame(update)
  first.dispatchEvent(new Event('close'))
  vi.advanceTimersByTime(499)
  expect(sockets).toHaveLength(1)
  vi.advanceTimersByTime(1)
  expect(sockets).toHaveLength(2)
  sockets[1]?.dispatchEvent(new Event('close'))
  vi.advanceTimersByTime(999)
  expect(sockets).toHaveLength(2)
  vi.advanceTimersByTime(1)
  const recovered = sockets[2]
  if (!recovered) throw new Error('Expected reconnect')
  recovered.dispatchEvent(new Event('open'))
  expect(refresh).toHaveBeenCalledTimes(2)

  recovered.dispatchEvent(new Event('close'))
  stop()
  recovered.frame(update)
  vi.advanceTimersByTime(8_000)
  expect(sockets).toHaveLength(3)
  expect(refresh).toHaveBeenCalledTimes(2)
})

test('reconnect refreshes an active REST query after a missed change', async () => {
  const sockets: TestSocket[] = []
  vi.stubGlobal(
    'WebSocket',
    class extends TestSocket {
      constructor() {
        super()
        sockets.push(this)
      }
    },
  )
  const client = new QueryClient()
  const api = createApiClient()
  const observer = new QueryObserver(client, {
    queryKey: ['products', 'detail', 'product-0002'],
    queryFn: ({ signal }) => api.getProduct('product-0002', { signal }),
  })
  const refreshed = Promise.withResolvers<void>()
  const unsubscribe = observer.subscribe(({ data }) => {
    if (data?.stock === 4) refreshed.resolve()
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const view = renderHook(() => useLiveStock(true), { wrapper })
  try {
    expect((await observer.refetch()).data?.stock).toBe(1)
    vi.useFakeTimers()
    sockets[0]?.dispatchEvent(new Event('close'))
    state.setBaseStock('product-0002', 4)
    vi.advanceTimersByTime(500)
    vi.useRealTimers()
    expect(sockets).toHaveLength(2)
    sockets[1]?.dispatchEvent(new Event('open'))
    await refreshed.promise
    expect(observer.getCurrentResult().data?.stock).toBe(4)
  } finally {
    view.unmount()
    unsubscribe()
    client.clear()
  }
})

test('updates product query freshness and closes the owning subscription under StrictMode', () => {
  const sockets: TestSocket[] = []
  vi.stubGlobal(
    'WebSocket',
    class extends TestSocket {
      constructor() {
        super()
        sockets.push(this)
      }
    },
  )
  const client = new QueryClient()
  const productKey = ['products', 'detail', 'product-0002']
  const accountKey = ['private', 'account']
  client.setQueryData(productKey, { stock: 1 })
  client.setQueryData(accountKey, { name: 'Demo' })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const view = renderHook(({ enabled }) => useLiveStock(enabled), {
    wrapper,
    initialProps: { enabled: true },
    reactStrictMode: true,
  })
  expect(sockets).toHaveLength(2)
  expect(sockets[0]?.close).toHaveBeenCalledOnce()
  sockets[0]?.frame(update)
  expect(client.getQueryState(productKey)?.isInvalidated).toBe(false)
  sockets[1]?.frame(update)
  expect(client.getQueryState(productKey)?.isInvalidated).toBe(true)
  expect(client.getQueryState(accountKey)?.isInvalidated).toBe(false)
  view.rerender({ enabled: false })
  expect(sockets[1]?.close).toHaveBeenCalledOnce()
  view.unmount()
  client.clear()
})

test('live inventory change is shared by detail, in-stock filtering, and order validation', async () => {
  const api = createApiClient({ getToken: () => token })
  const token = state.startSession()
  state.setBaseStock('product-0002', 0)
  expect((await api.getProduct('product-0002')).stock).toBe(0)
  expect(
    await api.listProducts({ search: 'Debug Duck 0001', inStock: true }),
  ).toEqual({ items: [], total: 0 })
  await expect(
    api.createOrder(
      { items: [{ productId: 'product-0002', quantity: 1 }] },
      'live-conflict',
    ),
  ).rejects.toMatchObject({
    failure: {
      status: 409,
      stock: { productId: 'product-0002', available: 0 },
    },
  })
})

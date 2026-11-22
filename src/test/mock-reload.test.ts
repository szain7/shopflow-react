// @vitest-environment jsdom
import { expect, test, vi } from 'vitest'
import { createApiClient } from '../api/client'
import { createHandlers } from '../mocks/handlers'
import { createMockState, demoCredentials } from '../mocks/state'
import { server } from './server'

test('restores the order ledger after a reload and requires a new login', async () => {
  const origin = 'http://shopflow.test'
  let token: string | undefined
  const api = createApiClient({ origin, getToken: () => token })
  const order = { items: [{ productId: 'product-0002', quantity: 1 }] }
  const key = 'reload'
  const storage = window.sessionStorage
  const start = new Date('2026-11-22T12:00:00Z')
  vi.setSystemTime(start)

  try {
    server.use(...createHandlers(createMockState(storage)))
    token = (await api.login(demoCredentials)).token
    const created = await api.createOrder(order, key)

    expect(Object.values(storage).join()).not.toContain(token)
    expect(Object.values(storage).join()).not.toContain(
      demoCredentials.password,
    )

    server.resetHandlers()
    server.use(...createHandlers(createMockState(storage)))
    await expect(api.getOrder(created.id)).rejects.toMatchObject({
      failure: { status: 401 },
    })

    token = (await api.login(demoCredentials)).token
    expect(await api.createOrder(order, key)).toEqual(created)
    expect((await api.getProduct('product-0002')).stock).toBe(0)

    vi.setSystemTime(+start + 2000)
    expect((await api.getOrder(created.id)).status).toBe('processing')
    vi.setSystemTime(+start + 5000)
    expect((await api.getOrder(created.id)).status).toBe('completed')
    vi.setSystemTime(+start + 30 * 60 * 1000)
    await expect(api.getMe()).rejects.toMatchObject({
      failure: { status: 401 },
    })
  } finally {
    vi.useRealTimers()
    storage.clear()
  }
})

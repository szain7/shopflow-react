import { delay, http, HttpResponse } from 'msw'
import { expect, test, vi } from 'vitest'
import { ApiRequestError, createApiClient } from '../api/client'
import { demoCredentials, demoUser } from '../mocks/state'
import { server } from './server'

const origin = 'http://shopflow.test'
const client = createApiClient({ origin })

test('rejects unsafe path IDs and invalid mutation data before sending', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch')
  try {
    for (const result of [
      client.getProduct('..'),
      client.getOrder('.'),
      client.login({ email: 'invalid', password: '' }),
      client.createOrder({ items: [] }, 'invalid'),
    ]) {
      await expect(result).rejects.toMatchObject({
        failure: { kind: 'invalid-request' },
      })
    }
    expect(fetchSpy).not.toHaveBeenCalled()
  } finally {
    fetchSpy.mockRestore()
  }
})

test('uses the current in-memory token on protected operations', async () => {
  let token: string | undefined
  const onUnauthorized = vi.fn()
  const api = createApiClient({ origin, getToken: () => token, onUnauthorized })
  const login = await api.login(demoCredentials)
  token = login.token
  expect(await api.getMe()).toEqual(demoUser)
  token = 'invalid'
  await expect(api.getMe()).rejects.toMatchObject({
    failure: { kind: 'http', status: 401 },
  })
  expect(onUnauthorized).toHaveBeenCalledExactlyOnceWith('invalid')
})

test('maps HTTP failure without exposing server text, even with malformed JSON', async () => {
  server.use(
    http.get('*/api/products', () =>
      HttpResponse.text('sensitive raw body', { status: 500 }),
    ),
  )
  await expect(client.listProducts()).rejects.toMatchObject({
    failure: { kind: 'http', status: 500 },
    message: 'The service could not complete the request. Please try again.',
  })
})

test('exposes only validated, actionable stock data', async () => {
  const login = await client.login(demoCredentials)
  const api = createApiClient({ origin, getToken: () => login.token })
  await expect(
    api.createOrder(
      { items: [{ productId: 'product-0002', quantity: 2 }] },
      'stock',
    ),
  ).rejects.toMatchObject({
    failure: {
      status: 409,
      stock: { productId: 'product-0002', available: 1 },
    },
  })
})

test.each([
  ['malformed JSON', () => HttpResponse.text('{')],
  ['invalid schema', () => HttpResponse.json({ items: null, total: 1 })],
  [
    'unexpected success status',
    () => HttpResponse.json({ items: [], total: 0 }, { status: 201 }),
  ],
])('rejects %s as invalid response data', async (_label, respond) => {
  server.use(http.get('*/api/products', respond))
  await expect(client.listProducts()).rejects.toMatchObject({
    failure: { kind: 'validation' },
  })
})

test('maps a fetch failure to a safe network error', async () => {
  server.use(http.get('*/api/products', () => HttpResponse.error()))
  await expect(client.listProducts()).rejects.toMatchObject({
    failure: { kind: 'network' },
  })
})

test('forwards the abort signal during a pending request', async () => {
  const started = Promise.withResolvers<void>()
  server.use(
    http.get('*/api/products', async () => {
      started.resolve()
      await delay(30)
      return HttpResponse.json({ items: [], total: 0 })
    }),
  )
  const controller = new AbortController()
  const result = client.listProducts({}, { signal: controller.signal })
  const rejected = expect(result).rejects.toMatchObject({
    failure: { kind: 'aborted' },
  })
  await started.promise
  controller.abort()
  await rejected
  await expect(result).rejects.toBeInstanceOf(ApiRequestError)
})

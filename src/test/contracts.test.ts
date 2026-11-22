import { expect, test } from 'vitest'
import {
  errorEnvelopeSchema,
  loginResponseSchema,
  productListSchema,
  queuedOrderSchema,
} from '../api/schemas'
import { demoCredentials, demoUser } from '../mocks/state'

const origin = 'http://shopflow.test'
const item = { productId: 'product-0002', quantity: 1 }

async function call(
  path: string,
  options: {
    token?: string
    body?: unknown
    key?: string
    scenario?: string
  } = {},
) {
  const headers = new Headers()
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`)
  if (options.key) headers.set('Idempotency-Key', options.key)
  if (options.scenario) headers.set('X-Shopflow-Mock', options.scenario)
  const body = JSON.stringify(options.body)
  if (body) headers.set('Content-Type', 'application/json')
  return fetch(origin + path, { headers, method: body ? 'POST' : 'GET', body })
}

async function login() {
  const response = await call('/api/login', { body: demoCredentials })
  expect(response.status).toBe(200)
  const payload: unknown = await response.json()
  const { token, user } = loginResponseSchema.parse(payload)
  expect(user).toEqual(demoUser)
  expect(payload).toEqual({ token, user })
  return token
}

async function expectError(response: Response, status: number, code: string) {
  expect(response.status).toBe(status)
  const { error } = errorEnvelopeSchema.parse(await response.json())
  expect(error.code).toBe(code)
  expect(error.message).not.toBe('')
  return error.details
}

test('paginates the 5,000-product catalog and filters before counting', async () => {
  const first = await call('/api/products')
  const second = await call('/api/products?page=2')
  expect(first.status).toBe(200)
  const page = productListSchema.parse(await first.json())
  const next = productListSchema.parse(await second.json())
  expect(page.total).toBe(5000)
  expect(page.items).toHaveLength(24)
  expect(next.items).toHaveLength(24)
  expect(new Set([...page.items, ...next.items].map(({ id }) => id)).size).toBe(
    48,
  )

  const filtered = await call(
    '/api/products?search=DEBUG&category=ducks&inStock=true&sort=price-desc',
  )
  const { items, total } = productListSchema.parse(await filtered.json())
  expect(total).toBe(1154)
  expect(
    items.every(({ stock, category }) => stock > 0 && category === 'ducks'),
  ).toBe(true)
  expect(items.map(({ price }) => price)).toEqual(
    items.map(({ price }) => price).sort((a, b) => b - a),
  )
})

test('returns catalog 500 and a reproducible empty response', async () => {
  await expectError(
    await call('/api/products', { scenario: 'server-error' }),
    500,
    'CATALOG_UNAVAILABLE',
  )
  const empty = await call('/api/products', { scenario: 'empty' })
  expect(empty.status).toBe(200)
  expect(await empty.json()).toEqual({ total: 0, items: [] })
})

test('returns product detail and a missing-product 404', async () => {
  const result = await call('/api/products/product-0002')
  expect(result.status).toBe(200)
  expect(await result.json()).toEqual({
    id: 'product-0002',
    name: 'Debug Duck 0001',
    price: 599,
    stock: 1,
    category: 'ducks',
    rating: 3.1,
    imageUrl: '/product-placeholder.svg',
  })
  await expectError(
    await call('/api/products/missing'),
    404,
    'PRODUCT_NOT_FOUND',
  )
})

test('returns login 400 field codes and 401 for invalid credentials', async () => {
  const details = await expectError(
    await call('/api/login', { body: { email: 'wrong' } }),
    400,
    'INVALID_LOGIN',
  )
  expect(details).toEqual({ email: 'INVALID', password: 'INVALID' })
  await expectError(
    await call('/api/login', {
      body: { ...demoCredentials, password: 'wrong' },
    }),
    401,
    'UNAUTHORIZED',
  )
})

test('returns /me for a valid session and 401 for an invalid session', async () => {
  const token = await login()
  const result = await call('/api/me', { token })
  expect(result.status).toBe(200)
  expect(await result.json()).toEqual(demoUser)
  await expectError(
    await call('/api/me', { token: 'invalid' }),
    401,
    'UNAUTHORIZED',
  )
})

test('creates one order across concurrent repeats and exposes its status', async () => {
  const token = await login()
  const options = { token, body: { items: [item] }, key: 'repeat' }
  const results = await Promise.all([
    call('/api/orders', options),
    call('/api/orders', options),
  ])
  const payloads: unknown[] = await Promise.all(
    results.map((result) => result.json()),
  )
  expect(results.map(({ status }) => status)).toEqual([201, 201])
  const { id } = queuedOrderSchema.parse(payloads[0])
  expect(payloads[0]).toEqual({ id, status: 'queued' })
  expect(payloads[1]).toEqual(payloads[0])

  const order = await call(`/api/orders/${id}`, { token })
  expect(order.status).toBe(200)
  expect(await order.json()).toEqual({ id, status: 'queued' })

  const product = await call('/api/products/product-0002')
  expect(await product.json()).toMatchObject({ stock: 0 })
  await expectError(
    await call('/api/orders', {
      ...options,
      body: { items: [{ ...item, quantity: 2 }] },
    }),
    400,
    'IDEMPOTENCY_MISMATCH',
  )
})

test('rejects unauthorized, invalid and out-of-stock submissions', async () => {
  const token = await login()
  await expectError(
    await call('/api/orders', { body: { items: [item] } }),
    401,
    'UNAUTHORIZED',
  )
  await expectError(
    await call('/api/orders', { token, key: 'invalid', body: { items: [] } }),
    400,
    'INVALID_ORDER',
  )
  const details = await expectError(
    await call('/api/orders', {
      token,
      key: 'too-many',
      body: { items: [{ ...item, quantity: 2 }] },
    }),
    409,
    'OUT_OF_STOCK',
  )
  expect(details).toEqual({ productId: item.productId, available: '1' })
})

test('rejects unauthorized and missing order reads', async () => {
  await expectError(await call('/api/orders/missing'), 401, 'UNAUTHORIZED')
  await expectError(
    await call('/api/orders/missing', { token: await login() }),
    404,
    'ORDER_NOT_FOUND',
  )
})

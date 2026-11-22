import { delay, http, HttpResponse } from 'msw'
import {
  categorySchema,
  loginBodySchema,
  orderBodySchema,
  sortSchema,
} from '../api/schemas'
import type { OrderBody, Product } from '../api/schemas'
import { inventory } from './inventory'
import { createMockState, demoCredentials, demoUser } from './state'

const pageSize = 24

function error(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string>,
) {
  return HttpResponse.json({ error: { code, message, details } }, { status })
}

function unauthorized() {
  return error(401, 'UNAUTHORIZED', 'Valid demo credentials are required.')
}

async function scenarioResponse(request: Request) {
  const scenario = request.headers.get('X-Shopflow-Mock')
  if (scenario === 'slow') await delay(600)
  if (scenario === 'malformed')
    return HttpResponse.text('{', {
      headers: { 'Content-Type': 'application/json' },
    })
  if (scenario === 'invalid-data') return HttpResponse.json({ items: null })
}

function canonicalOrder(order: OrderBody) {
  return JSON.stringify(
    [...order.items].sort((a, b) => a.productId.localeCompare(b.productId)),
  )
}

export function createHandlers(state: ReturnType<typeof createMockState>) {
  const getStock = (product: Product, reserved: ReadonlyMap<string, number>) =>
    Math.max(0, product.stock - (reserved.get(product.id) ?? 0))

  return [
    http.get('*/api/products', async ({ request }) => {
      const override = await scenarioResponse(request)
      if (override) return override
      const scenario = request.headers.get('X-Shopflow-Mock')
      if (scenario === 'server-error')
        return error(500, 'CATALOG_UNAVAILABLE', 'Demo catalog failure.')
      if (scenario === 'empty')
        return HttpResponse.json({ items: [], total: 0 })

      const params = new URL(request.url).searchParams
      const search = (params.get('search') ?? '').trim().toLowerCase()
      const category = categorySchema.safeParse(params.get('category')).data
      const sort = sortSchema.safeParse(params.get('sort')).data ?? 'name-asc'
      const requestedPage = Number(params.get('page'))
      const page =
        Number.isSafeInteger(requestedPage) && requestedPage > 0
          ? requestedPage
          : 1
      const reserved = state.reservedStock()
      const items = Array.from(inventory.values())
        .filter(
          (product) =>
            (!category || product.category === category) &&
            product.name.toLowerCase().includes(search),
        )
        .map((product) => ({ ...product, stock: getStock(product, reserved) }))
        .filter(({ stock }) => params.get('inStock') !== 'true' || stock > 0)
        .sort((a, b) => {
          const comparisons = {
            'name-asc': a.name.localeCompare(b.name),
            'price-asc': a.price - b.price,
            'price-desc': b.price - a.price,
            'rating-desc': b.rating - a.rating,
          }
          return comparisons[sort] || a.id.localeCompare(b.id)
        })

      return HttpResponse.json({
        items: items.slice((page - 1) * pageSize, page * pageSize),
        total: items.length,
      })
    }),
    http.get('*/api/products/:id', async ({ params, request }) => {
      const override = await scenarioResponse(request)
      if (override) return override
      const product =
        typeof params.id === 'string' ? inventory.get(params.id) : undefined
      if (!product)
        return error(404, 'PRODUCT_NOT_FOUND', 'Product does not exist.')
      return HttpResponse.json({
        ...product,
        stock: getStock(product, state.reservedStock()),
      })
    }),
    http.post('*/api/login', async ({ request }) => {
      const parsed = loginBodySchema.safeParse(
        await request.json().catch(() => undefined),
      )
      if (!parsed.success) {
        const invalidEmail = parsed.error.issues.some(
          ({ path }) => path[0] === 'email',
        )
        const invalidPassword = parsed.error.issues.some(
          ({ path }) => path[0] === 'password',
        )
        const details: Record<string, string> = {}
        if (invalidEmail) details.email = 'INVALID'
        if (invalidPassword) details.password = 'INVALID'
        return error(400, 'INVALID_LOGIN', 'Invalid login form.', details)
      }
      if (
        parsed.data.email !== demoCredentials.email ||
        parsed.data.password !== demoCredentials.password
      ) {
        return unauthorized()
      }
      return HttpResponse.json({ token: state.startSession(), user: demoUser })
    }),
    http.get('*/api/me', ({ request }) =>
      state.isAuthorized(request)
        ? HttpResponse.json(demoUser)
        : unauthorized(),
    ),
    http.post('*/api/orders', async ({ request }) => {
      const key = request.headers.get('Idempotency-Key')?.trim()
      const parsed = orderBodySchema.safeParse(
        await request.json().catch(() => undefined),
      )
      // Check authorization after awaiting the body, before changing inventory.
      if (!state.isAuthorized(request)) return unauthorized()
      if (!parsed.success || !key || key.length > 200) {
        return error(
          400,
          'INVALID_ORDER',
          'Supply valid items and an idempotency key.',
        )
      }
      const order = parsed.data
      const previous = state.findSubmission(key)
      if (previous) {
        if (canonicalOrder(previous.order) !== canonicalOrder(order)) {
          return error(
            400,
            'IDEMPOTENCY_MISMATCH',
            'The key belongs to a different order.',
          )
        }
        return HttpResponse.json(
          { id: previous.id, status: 'queued' },
          { status: 201 },
        )
      }

      const reserved = state.reservedStock()
      let total = 0
      for (const { productId, quantity } of order.items) {
        const product = inventory.get(productId)
        if (!product)
          return error(400, 'UNKNOWN_PRODUCT', 'An order item does not exist.')
        const available = getStock(product, reserved)
        if (quantity > available) {
          return error(409, 'OUT_OF_STOCK', 'An item exceeds current stock.', {
            productId,
            available: String(available),
          })
        }
        total += product.price * quantity
      }

      if (!Number.isSafeInteger(total))
        return error(400, 'INVALID_ORDER', 'Invalid order total.')
      const entry = state.createOrder(key, order)
      return HttpResponse.json(
        { id: entry.id, status: 'queued' },
        { status: 201 },
      )
    }),
    http.get('*/api/orders/:id', ({ request, params }) => {
      if (!state.isAuthorized(request)) return unauthorized()
      const entry =
        typeof params.id === 'string' ? state.findOrder(params.id) : undefined
      if (!entry) return error(404, 'ORDER_NOT_FOUND', 'Order does not exist.')
      const elapsed = Date.now() - entry.created
      const status =
        elapsed >= 5000
          ? 'completed'
          : elapsed >= 2000
            ? 'processing'
            : 'queued'
      return HttpResponse.json({ id: entry.id, status })
    }),
  ]
}

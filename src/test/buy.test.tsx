// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { StrictMode } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '../App'
import { orderBodySchema, productSchema } from '../api/schemas'
import {
  cartActions,
  createShopStore,
  selectCartCount,
  selectCartTotal,
  sessionActions,
} from '../app/store'
import { inventory } from '../mocks/inventory'
import { createHandlers } from '../mocks/handlers'
import { createMockState, demoCredentials, demoUser } from '../mocks/state'
import { server, state } from './server'

const cartKey = 'shopflow.cart.v1'
const intentKey = 'shopflow.checkout.v1'
const product = productSchema.parse(inventory.get('product-0003'))

function create() {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  })
  const store = createShopStore(client, localStorage, sessionStorage)
  return { client, store }
}

function open(path: string, runtime = create()) {
  const { client, store } = runtime
  const view = render(
    <StrictMode>
      <Provider store={store}>
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={[path]}>
            <App />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>
    </StrictMode>,
  )
  return { ...view, store, client, user: userEvent.setup() }
}

async function signIn(
  user: ReturnType<typeof userEvent.setup>,
  password = demoCredentials.password,
) {
  await user.type(screen.getByLabelText('Email'), demoCredentials.email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

function authenticated(quantity = 1) {
  const runtime = create()
  runtime.store.dispatch(
    cartActions.setQuantity({ product: { ...product }, quantity }),
  )
  runtime.store.dispatch(
    sessionActions.signedIn({
      token: state.startSession(),
      userId: demoUser.id,
    }),
  )
  return runtime
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

test('validates persistence and derives quantity and price from cart lines', () => {
  localStorage.setItem(cartKey, '{broken')
  const { store } = create()
  expect(store.getState().cart).toEqual([])
  const fixture = { ...product }
  store.dispatch(cartActions.setQuantity({ product: fixture, quantity: 1 }))
  store.dispatch(cartActions.setQuantity({ product: fixture, quantity: 2 }))
  for (const quantity of [Number.NaN, Infinity, 0, -1, 1.5, 3]) {
    store.dispatch(cartActions.setQuantity({ product: fixture, quantity }))
  }
  expect(selectCartCount(store.getState())).toBe(2)
  expect(selectCartTotal(store.getState())).toBe(1798)
  expect(create().store.getState().cart).toEqual(store.getState().cart)
  localStorage.setItem(
    cartKey,
    JSON.stringify([
      {
        id: fixture.id,
        name: fixture.name,
        price: fixture.price,
        quantity: -1,
      },
    ]),
  )
  expect(create().store.getState().cart).toEqual([])
})

test('adds from the catalog, announces invalid quantities, updates totals, and persists edits and removal', async () => {
  const view = open('/?search=developer+coffee+0001')
  await view.user.click(
    await screen.findByRole('button', {
      name: 'Add Developer Coffee 0001 to cart',
    }),
  )
  await view.user.click(screen.getByRole('link', { name: /Cart \(1\)/ }))
  const field = await screen.findByRole('textbox', {
    name: 'Quantity for Developer Coffee 0001',
  })
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled(),
  )
  await view.user.clear(field)
  await view.user.type(field, '3')
  await view.user.click(screen.getByRole('button', { name: 'Update' }))
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Enter a whole number from 1 to 2.',
  )
  expect(field).toHaveFocus()
  await view.user.clear(field)
  await view.user.type(field, '2')
  await view.user.click(screen.getByRole('button', { name: 'Update' }))
  expect(screen.getByRole('link', { name: /Cart \(2\).*17\.98/ })).toBeVisible()
  view.unmount()

  const reloaded = open('/cart')
  expect(
    await screen.findByRole('textbox', {
      name: 'Quantity for Developer Coffee 0001',
    }),
  ).toHaveValue('2')
  await reloaded.user.click(
    screen.getByRole('button', { name: 'Remove Developer Coffee 0001' }),
  )
  expect(screen.getByText('Your cart is empty.')).toBeVisible()
  expect(create().store.getState().cart).toEqual([])
})

function orderRequests(calls: Parameters<typeof fetch>[]) {
  return calls
    .filter(([input]) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url
      return url.endsWith('/api/orders')
    })
    .map(([, options]) => ({
      key: new Headers(options?.headers).get('Idempotency-Key'),
      body: options?.body,
    }))
}

test('names a stock conflict, preserves the cart, and uses a new key after correction', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch')
  const view = open('/checkout', authenticated(2))
  const place = screen.getByRole('button', { name: 'Place order' })
  await waitFor(() => expect(place).toBeEnabled())
  state.createOrder(crypto.randomUUID(), {
    items: [{ productId: 'product-0003', quantity: 1 }],
  })
  await view.user.click(place)
  expect(
    await screen.findByText(
      'Developer Coffee 0001 has only 1 available. Return to your cart and reduce the quantity.',
    ),
  ).toBeVisible()
  expect(view.store.getState().cart[0]?.quantity).toBe(2)
  expect(sessionStorage.getItem(intentKey)).toBeNull()
  await view.user.click(screen.getByRole('link', { name: 'Back to cart' }))
  expect(
    await screen.findByText('Only 1 available. Reduce the quantity.'),
  ).toBeVisible()
  const quantity = screen.getByRole('textbox', {
    name: `Quantity for ${product.name}`,
  })
  await view.user.clear(quantity)
  await view.user.type(quantity, '1')
  await view.user.click(screen.getByRole('button', { name: 'Update' }))
  await view.user.click(screen.getByRole('link', { name: 'Checkout' }))
  const retry = screen.getByRole('button', { name: 'Place order' })
  await waitFor(() => expect(retry).toBeEnabled())
  await view.user.click(retry)
  expect(await screen.findByText('Order received')).toBeVisible()
  const attempts = orderRequests(fetchSpy.mock.calls)
  expect(attempts).toHaveLength(2)
  expect(attempts[0]?.key).toBeTruthy()
  expect(attempts[1]?.key).toBeTruthy()
  expect(attempts[1]?.key).not.toBe(attempts[0]?.key)
  expect(attempts.map(({ body }) => body)).toEqual(
    [2, 1].map((quantity) =>
      JSON.stringify({ items: [{ productId: product.id, quantity }] }),
    ),
  )
})

test.each([false, true])(
  'recovers the original order after a lost response, reload=%s',
  async (reload) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const runtime = authenticated(2)
    let mock = createMockState(sessionStorage)
    runtime.store.dispatch(
      sessionActions.signedIn({
        token: mock.startSession(),
        userId: demoUser.id,
      }),
    )
    server.use(...createHandlers(mock))
    const release = Promise.withResolvers<void>()
    const accepted = Promise.withResolvers<void>()
    const keys: string[] = []
    let createdId = ''
    server.use(
      http.post('*/api/orders', async ({ request }) => {
        const key = request.headers.get('Idempotency-Key')
        if (!key) throw new Error('Expected idempotency key')
        keys.push(key)
        const body = orderBodySchema.parse(await request.json())
        createdId = mock.createOrder(key, body).id
        accepted.resolve()
        await release.promise
        return HttpResponse.error()
      }),
    )
    const initial = open('/checkout', runtime)
    try {
      const place = screen.getByRole('button', { name: 'Place order' })
      await waitFor(() => expect(place).toBeEnabled())
      fireEvent.click(place)
      fireEvent.click(place)
      await accepted.promise
      expect(keys).toHaveLength(1)
      expect(
        screen.getByRole('button', { name: 'Placing order…' }),
      ).toBeDisabled()
      expect(initial.store.getState().cart[0]?.quantity).toBe(2)
      expect(sessionStorage.getItem(intentKey)).toContain(keys[0])
      expect(sessionStorage.getItem(intentKey)).not.toContain(
        runtime.store.getState().session?.token,
      )
      release.resolve()
      expect(await screen.findByText(/Unable to connect/)).toBeVisible()
      expect(initial.store.getState().cart[0]?.quantity).toBe(2)
      server.resetHandlers()
      if (reload) mock = createMockState(sessionStorage)
      server.use(...createHandlers(mock))

      let view = initial
      if (reload) {
        initial.unmount()
        view = open('/checkout')
        expect(
          await screen.findByRole('heading', { name: 'Sign in' }),
        ).toBeVisible()
        await signIn(view.user)
      }
      await view.user.click(
        await screen.findByRole('button', { name: 'Retry order' }),
      )
      expect(await screen.findByText(`Order ${createdId}`)).toBeVisible()
      const attempts = orderRequests(fetchSpy.mock.calls)
      expect(attempts).toHaveLength(2)
      expect(attempts[1]).toEqual(attempts[0])
      expect(mock.reservedStock().get('product-0003')).toBe(2)
      expect(view.store.getState().cart).toEqual([])
    } finally {
      release.resolve()
    }
  },
)

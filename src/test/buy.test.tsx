// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  act,
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
import { safeReturnPath } from '../features/auth/return-path'
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

test.each([
  '//elsewhere.test',
  '/\\elsewhere.test',
  'https://elsewhere.test',
  '/login',
  '/%2felsewhere.test',
])('rejects unsafe return destination %s', (value) =>
  expect(safeReturnPath(value)).toBe('/'),
)

test('returns to protected checkout after login, and logout clears private data', async () => {
  const view = open('/checkout')
  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible()
  await signIn(view.user)
  expect(await screen.findByRole('heading', { name: 'Checkout' })).toBeVisible()
  const session = view.store.getState().session
  if (!session) throw new Error('Expected signed-in session')
  expect(create().store.getState().session).toBeNull()
  expect(localStorage.length + sessionStorage.length).toBe(0)
  await view.user.click(screen.getByRole('link', { name: 'Account' }))
  expect(await screen.findByText(demoUser.email)).toBeVisible()
  const key = ['private', session.cacheScope, 'account']
  expect(view.client.getQueryData(key)).toBeDefined()
  await view.user.click(screen.getByRole('button', { name: 'Sign out' }))
  expect(view.client.getQueryData(key)).toBeUndefined()
  expect(view.store.getState().session).toBeNull()
  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('a successful sign-in ignores an external return URL and keeps credentials out of storage and app logs', async () => {
  const logs = [
    vi.spyOn(console, 'log'),
    vi.spyOn(console, 'info'),
    vi.spyOn(console, 'debug'),
    vi.spyOn(console, 'warn'),
    vi.spyOn(console, 'error'),
  ]
  const view = open('/login?returnTo=%2F%2Felsewhere.test')
  await signIn(view.user)
  expect(await screen.findByRole('heading', { name: 'Shopflow' })).toBeVisible()
  const token = view.store.getState().session?.token
  expect(token).toBeTruthy()
  expect(localStorage.length + sessionStorage.length).toBe(0)
  const output = JSON.stringify(logs.flatMap((log) => log.mock.calls))
  expect(output).not.toContain(token)
  expect(output).not.toContain(demoCredentials.password)
})

test('an in-flight account request cannot restore private data after logout and a new login', async () => {
  const runtime = authenticated()
  const previous = runtime.store.getState().session
  if (!previous) throw new Error('Expected original session')
  const started = Promise.withResolvers<void>()
  const aborted = Promise.withResolvers<void>()
  const release = Promise.withResolvers<void>()
  const completed = Promise.withResolvers<void>()
  const nextUser = {
    id: 'next',
    name: 'Next Shopper',
    email: 'next@example.test',
  }
  server.use(
    http.get('*/api/me', async ({ request }) => {
      if (request.headers.get('Authorization') !== `Bearer ${previous.token}`) {
        return HttpResponse.json(nextUser)
      }
      request.signal.addEventListener('abort', () => aborted.resolve(), {
        once: true,
      })
      started.resolve()
      await release.promise
      completed.resolve()
      return HttpResponse.json(demoUser)
    }),
    http.post('*/api/login', () =>
      HttpResponse.json({ user: nextUser, token: 'next-session' }),
    ),
  )
  const { client, user, store } = open('/account', runtime)
  try {
    await started.promise
    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    await aborted.promise
    expect(client.getQueriesData({ queryKey: ['private'] })).toEqual([])
    await signIn(user)
    expect(await screen.findByText(nextUser.name)).toBeVisible()
    await act(async () => {
      release.resolve()
      await completed.promise
    })
    const next = store.getState().session
    expect(next?.cacheScope).not.toBe(previous.cacheScope)
    expect(client.getQueriesData({ queryKey: ['private'] })).toEqual([
      [['private', next?.cacheScope, 'account'], nextUser],
    ])
    expect(screen.queryByText(demoUser.email)).not.toBeInTheDocument()
  } finally {
    release.resolve()
  }
})

test('announces local validation and safe server 400 field errors', async () => {
  const view = open('/login')
  await view.user.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(screen.getByLabelText('Email')).toHaveFocus()
  expect(screen.getByText('Enter your password.')).toBeVisible()
  server.use(
    http.post('*/api/login', () =>
      HttpResponse.json(
        {
          error: {
            code: 'INVALID_LOGIN',
            message: 'sensitive server text',
            details: { password: 'INVALID' },
          },
        },
        { status: 400 },
      ),
    ),
  )
  await signIn(view.user)
  expect(
    await screen.findByText('Check your password and try again.'),
  ).toBeVisible()
  expect(screen.getByLabelText('Password')).toHaveFocus()
  expect(screen.queryByText('sensitive server text')).not.toBeInTheDocument()
})

test('guards duplicate login submits and handles incorrect credentials', async () => {
  const release = Promise.withResolvers<void>()
  let calls = 0
  server.use(
    http.post('*/api/login', async () => {
      calls++
      await release.promise
      return HttpResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'private' } },
        { status: 401 },
      )
    }),
  )
  const view = open('/login?returnTo=https%3A%2F%2Felsewhere.test')
  try {
    await signIn(view.user, 'wrong-password')
    const button = screen.getByRole('button', { name: 'Signing in…' })
    expect(button).toBeDisabled()
    const form = button.closest('form')
    if (!form) throw new Error('Missing login form')
    fireEvent.submit(form)
    await waitFor(() => expect(calls).toBe(1))
    release.resolve()
    expect(
      await screen.findByText('Email or password is incorrect.'),
    ).toBeVisible()
    expect(view.store.getState().session).toBeNull()
  } finally {
    release.resolve()
  }
})

test('expires the session on a protected 401, drops private cache, and preserves the intended route', async () => {
  const runtime = create()
  runtime.store.dispatch(
    sessionActions.signedIn({ token: 'expired', userId: demoUser.id }),
  )
  runtime.client.setQueryData(['private', 'order', 'old'], {
    id: 'old',
    status: 'queued',
  })
  const view = open('/account', runtime)
  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible()
  expect(view.store.getState().session).toBeNull()
  expect(view.client.getQueryData(['private', 'order', 'old'])).toBeUndefined()
  await signIn(view.user)
  expect(await screen.findByText(demoUser.email)).toBeVisible()
})

test('public 401 clears only the session that started the request and sends no token', async () => {
  const { store } = authenticated()
  const started = Promise.withResolvers<void>()
  const release = Promise.withResolvers<void>()
  server.use(
    http.get('*/api/products', async ({ request }) => {
      expect(request.headers.has('Authorization')).toBe(false)
      started.resolve()
      await release.promise
      return HttpResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'private' } },
        { status: 401 },
      )
    }),
  )
  const stale = store.api.listProducts().catch((error: unknown) => error)
  try {
    await started.promise
    store.dispatch(
      sessionActions.signedIn({ token: 'new-token', userId: demoUser.id }),
    )
    release.resolve()
    expect(await stale).toMatchObject({ failure: { status: 401 } })
    expect(store.getState().session?.token).toBe('new-token')
    await expect(store.api.listProducts()).rejects.toMatchObject({
      failure: { status: 401 },
    })
    expect(store.getState().session).toBeNull()
  } finally {
    release.resolve()
  }
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

test('offers a safe retry on server failure and distinguishes a missing order', async () => {
  const runtime = authenticated()
  server.use(
    http.get('*/api/orders/:id', () =>
      HttpResponse.json(
        {
          error: { code: 'SERVER_ERROR', message: 'private server trace' },
        },
        { status: 500 },
      ),
    ),
  )
  const view = open('/orders/missing', runtime)
  expect(
    await screen.findByText(
      'The service could not complete the request. Please try again.',
    ),
  ).toBeVisible()
  expect(screen.queryByText('private server trace')).not.toBeInTheDocument()
  server.resetHandlers()
  await view.user.click(screen.getByRole('button', { name: 'Try again' }))
  expect(
    await screen.findByRole('heading', { name: 'Order not found' }),
  ).toBeVisible()
})

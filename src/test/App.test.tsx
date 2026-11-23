// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { StrictMode } from 'react'
import { Provider } from 'react-redux'
import { Link, MemoryRouter, useLocation, useNavigate } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '../App'
import { createShopStore } from '../app/store'
import { useDebouncedAction } from '../hooks/useDebouncedAction'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { inventory } from '../mocks/inventory'
import { server } from './server'

function NavigationControls() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <aside>
      <button
        onClick={() => {
          void navigate(-1)
        }}
      >
        History back
      </button>
      <button
        onClick={() => {
          void navigate(1)
        }}
      >
        History forward
      </button>
      <Link to="/products/product-0003">Open coffee directly</Link>
      <output aria-label="Location">
        {location.pathname}
        {location.search}
      </output>
    </aside>
  )
}

function open(entry = '/', mockScenarios = false) {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  })
  const view = render(
    <StrictMode>
      <Provider store={createShopStore(client)}>
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={[entry]}>
            <App mockScenarios={mockScenarios} />
            <NavigationControls />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>
    </StrictMode>,
  )
  return { ...view, user: userEvent.setup(), client }
}

const locationText = () => screen.getByLabelText('Location').textContent
const searchField = () =>
  screen.getByRole('searchbox', { name: 'Search products' })

test('debounce replaces pending values and clears its timer on unmount', () => {
  vi.useFakeTimers()
  try {
    const action = vi.fn()
    const { rerender, unmount } = renderHook(
      ({ value }) => useDebouncedAction(value, true, 300, action),
      { initialProps: { value: 'd' }, reactStrictMode: true },
    )
    vi.advanceTimersByTime(200)
    rerender({ value: 'duck' })
    vi.advanceTimersByTime(300)
    expect(action).toHaveBeenCalledExactlyOnceWith('duck')
    rerender({ value: 'coffee' })
    unmount()
    vi.advanceTimersByTime(300)
    expect(action).toHaveBeenCalledTimes(1)
  } finally {
    vi.useRealTimers()
  }
})

test('stock sockets stay handled with REST scenario overrides and after reset', async () => {
  async function connectAndClose() {
    const url = new URL('/mock/stock', window.location.href)
    url.protocol = 'ws:'
    const socket = new WebSocket(url)
    try {
      await new Promise<void>((resolve, reject) => {
        socket.addEventListener('open', () => resolve(), { once: true })
        socket.addEventListener(
          'error',
          () => reject(new Error('Stock socket failed to open')),
          { once: true },
        )
      })
    } finally {
      socket.close()
    }
  }

  server.use(
    http.get('*/api/products', () =>
      HttpResponse.json({ items: [], total: 0 }),
    ),
  )
  await connectAndClose()
  server.resetHandlers()
  await connectAndClose()
})

test('restores the previous document title after route-title cleanup', () => {
  const previous = document.title
  const { rerender, unmount } = renderHook(
    ({ title }) => useDocumentTitle(title),
    { initialProps: { title: 'Catalog' }, reactStrictMode: true },
  )
  expect(document.title).toBe('Catalog')
  rerender({ title: 'Product' })
  expect(document.title).toBe('Product')
  unmount()
  expect(document.title).toBe(previous)
})

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

test('navigates by keyboard, shows formatted product details, and returns to the applied catalog', async () => {
  const { user } = open('/?search=duck')
  await screen.findByRole('link', { name: 'Debug Duck 0001' })
  await user.tab()
  const skipLink = screen.getByRole('link', { name: 'Skip to main content' })
  expect(skipLink).toHaveFocus()
  expect(skipLink).toHaveAttribute('href', '#main-content')

  const product = screen.getByRole('link', { name: 'Debug Duck 0001' })
  product.focus()
  await user.keyboard('{Enter}')
  expect(screen.getByRole('main')).toHaveFocus()
  expect(
    await screen.findByRole('heading', { name: 'Debug Duck 0001' }),
  ).toBeVisible()
  expect(screen.getByText('$5.99')).toBeVisible()
  expect(screen.getByText('1 in stock')).toBeVisible()
  expect(document.title).toBe('Debug Duck 0001 | Shopflow')

  await user.click(screen.getByRole('link', { name: 'Back to products' }))
  expect(searchField()).toHaveValue('duck')
  expect(
    await screen.findByRole('link', { name: 'Debug Duck 0001' }),
  ).toBeVisible()
})

test('restores shared URLs and history for sorting, stock, category, and page', async () => {
  const entry =
    '/?search=duck&category=ducks&inStock=true&sort=price-desc&page=2'
  const view = open(entry)
  expect(await screen.findByText('1,154 products · Page 2 of 49')).toBeVisible()
  expect(searchField()).toHaveValue('duck')
  expect(screen.getByRole('checkbox', { name: 'In stock only' })).toBeChecked()
  expect(screen.getByLabelText('Sort by')).toHaveValue('price-desc')
  expect(screen.getByLabelText('Category')).toHaveValue('ducks')
  const firstCard = screen.getAllByRole('listitem')[0]
  expect(firstCard).toBeDefined()
  if (!firstCard) throw new Error('Expected catalog items')
  expect(within(firstCard).getByText(/in stock/)).toBeVisible()

  await view.user.click(screen.getByRole('link', { name: 'Next page' }))
  expect(await screen.findByText('1,154 products · Page 3 of 49')).toBeVisible()
  await view.user.selectOptions(screen.getByLabelText('Sort by'), 'price-asc')
  expect(await screen.findByText('1,154 products · Page 1 of 49')).toBeVisible()
  expect(locationText()).not.toContain('page=')

  await view.user.click(screen.getByRole('button', { name: 'History back' }))
  expect(await screen.findByText('1,154 products · Page 3 of 49')).toBeVisible()
  expect(screen.getByLabelText('Sort by')).toHaveValue('price-desc')
  await view.user.click(screen.getByRole('button', { name: 'History forward' }))
  expect(screen.getByLabelText('Sort by')).toHaveValue('price-asc')

  view.unmount()
  const reopened = open(entry)
  expect(await screen.findByText('1,154 products · Page 2 of 49')).toBeVisible()
  await reopened.user.click(
    screen.getByRole('button', { name: 'Clear filters' }),
  )
  expect(
    await screen.findByText('5,000 products · Page 1 of 209'),
  ).toBeVisible()
  expect(locationText()).toBe('/')
  expect(searchField()).toHaveValue('')
})

test('canonicalizes invalid filters and offers recovery for an out-of-range page', async () => {
  const { user } = open('/?category=unknown&sort=unknown&inStock=1&page=-4')
  expect(
    await screen.findByText('5,000 products · Page 1 of 209'),
  ).toBeVisible()
  expect(locationText()).toBe('/')
  cleanup()

  open('/?page=999')
  expect(await screen.findByText('This page has no products.')).toBeVisible()
  await user.click(screen.getByRole('link', { name: 'Last available page' }))
  expect(
    await screen.findByText('5,000 products · Page 209 of 209'),
  ).toBeVisible()
})

test('discards an uncommitted search on Back and Forward', async () => {
  const { user } = open('/?search=duck')
  await screen.findByRole('link', { name: 'Debug Duck 0001' })
  await user.click(screen.getByRole('link', { name: 'Next page' }))
  await screen.findByText(/Page 2 of/)
  fireEvent.change(searchField(), { target: { value: 'coffee' } })
  expect(screen.getByText('Updating search…')).toBeVisible()

  await user.click(screen.getByRole('button', { name: 'History back' }))
  expect(searchField()).toHaveValue('duck')
  await user.click(screen.getByRole('button', { name: 'History forward' }))
  expect(searchField()).toHaveValue('duck')
  expect(await screen.findByText(/Page 2 of/)).toBeVisible()
  expect(locationText()).toBe('/?search=duck&page=2')
})

test.each([
  ['/?mock=empty', 'No products match your filters.'],
  ['/?mock=slow', 'Loading products…'],
  ['/products/product-0002?mock=slow', 'Loading product…'],
  ['/products/product-0002?mock=empty', 'This product is unavailable.'],
])('announces the reproducible state for %s', async (url, message) => {
  open(url, true)
  expect(await screen.findByText(message)).toHaveAttribute('role', 'status')
})

test.each([
  ['/?mock=server-error', 'Shopflow'],
  ['/products/product-0002?mock=malformed', 'Debug Duck 0001'],
])('announces a safe error and retries %s', async (url, heading) => {
  const { user } = open(url, true)
  await screen.findByRole('alert')
  const product = inventory.get('product-0002')
  const detail = url.includes('/products/')
  server.use(
    http.get(detail ? '*/api/products/:id' : '*/api/products', () =>
      HttpResponse.json(detail ? product : { items: [], total: 0 }),
    ),
  )
  screen.getByRole('button', { name: 'Try again' }).focus()
  await user.keyboard('{Enter}')
  if (!detail)
    expect(
      await screen.findByText('No products match your filters.'),
    ).toBeVisible()
  expect(await screen.findByRole('heading', { name: heading })).toBeVisible()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.getByRole('main')).toHaveFocus()
})

test.each([
  ['/products/missing', 'Product not found', 'Back to products'],
  ['/missing/page', 'Page not found', 'Browse products'],
])('offers a return path from %s', async (url, heading, link) => {
  open(url)
  expect(await screen.findByRole('heading', { name: heading })).toBeVisible()
  expect(screen.getByRole('link', { name: link })).toHaveAttribute('href', '/')
})

test('replaces a broken product image with the placeholder', async () => {
  const product = inventory.get('product-0002')
  if (!product) throw new Error('Expected mock product')
  server.use(
    http.get('*/api/products/:id', () =>
      HttpResponse.json({ ...product, imageUrl: '/broken.png' }),
    ),
  )
  open('/products/product-0002')
  const image = await screen.findByRole('img', { name: product.name })
  fireEvent.error(image)
  expect(image).toHaveAttribute('src', '/product-placeholder.svg')
  expect(image).toHaveAttribute('alt', '')
})

test('cancels an old detail request and never shows it on the new route', async () => {
  const started = Promise.withResolvers<void>()
  const release = Promise.withResolvers<void>()
  const aborted = Promise.withResolvers<void>()
  server.use(
    http.get('*/api/products/product-0002', async ({ request }) => {
      request.signal.addEventListener('abort', () => aborted.resolve(), {
        once: true,
      })
      started.resolve()
      await release.promise
      return HttpResponse.json(inventory.get('product-0002'))
    }),
  )
  const { user } = open('/products/product-0002')
  try {
    await started.promise
    await user.click(screen.getByRole('link', { name: 'Open coffee directly' }))
    await aborted.promise
    expect(
      await screen.findByRole('heading', { name: 'Developer Coffee 0001' }),
    ).toBeVisible()
    await act(async () => {
      release.resolve()
      await release.promise
    })
    expect(
      screen.queryByRole('heading', { name: 'Debug Duck 0001' }),
    ).not.toBeInTheDocument()
  } finally {
    release.resolve()
  }
})

test('does not show a previously loaded product while the next detail is pending', async () => {
  const release = Promise.withResolvers<void>()
  server.use(
    http.get('*/api/products/product-0003', async () => {
      await release.promise
      return HttpResponse.json(inventory.get('product-0003'))
    }),
  )
  const { user } = open('/products/product-0002')
  try {
    await screen.findByRole('heading', { name: 'Debug Duck 0001' })
    await user.click(screen.getByRole('link', { name: 'Open coffee directly' }))
    expect(screen.getByText('Loading product…')).toBeVisible()
    expect(screen.queryByText('Debug Duck 0001')).not.toBeInTheDocument()
    release.resolve()
    expect(
      await screen.findByRole('heading', { name: 'Developer Coffee 0001' }),
    ).toBeVisible()
  } finally {
    release.resolve()
  }
})

test('keeps the latest search visible when the old server handler finishes late', async () => {
  const started = Promise.withResolvers<void>()
  const release = Promise.withResolvers<void>()
  const finished = Promise.withResolvers<void>()
  const aborted = Promise.withResolvers<void>()
  const requests: string[] = []
  server.use(
    http.get('*/api/products', async ({ request }) => {
      const search = new URL(request.url).searchParams.get('search') ?? ''
      requests.push(search)
      const id = search === 'duck' ? 'product-0002' : 'product-0003'

      if (search === 'duck') {
        expect(request.headers.get('X-Shopflow-Mock')).toBe('slow')
        request.signal.addEventListener('abort', () => aborted.resolve(), {
          once: true,
        })
        started.resolve()
        await release.promise
        finished.resolve()
      }
      return HttpResponse.json({ items: [inventory.get(id)], total: 1 })
    }),
  )
  const { user } = open('/?mock=race', true)
  expect(
    await screen.findByRole('link', { name: 'Developer Coffee 0001' }),
  ).toBeVisible()
  try {
    await user.type(searchField(), 'duck')
    expect(screen.getByText('Updating search…')).toBeVisible()
    expect(
      screen.queryByRole('link', { name: 'Developer Coffee 0001' }),
    ).not.toBeInTheDocument()
    await started.promise
    await user.clear(searchField())
    await user.type(searchField(), 'coffee')
    await aborted.promise
    expect(
      await screen.findByRole('link', { name: 'Developer Coffee 0001' }),
    ).toBeVisible()
    await act(async () => {
      release.resolve()
      await finished.promise
    })
    expect(
      screen.queryByRole('link', { name: 'Debug Duck 0001' }),
    ).not.toBeInTheDocument()
    expect(locationText()).toBe('/?search=coffee&mock=race')
    expect(requests.filter(Boolean)).toEqual(['duck', 'coffee'])
  } finally {
    release.resolve()
  }
})

test('removes the scroll listener on unmount and moves focus when returning to top', async () => {
  const scrollTo = vi.spyOn(window, 'scrollTo')
  const add = vi.spyOn(window, 'addEventListener')
  const remove = vi.spyOn(window, 'removeEventListener')
  const before = window.scrollY
  const { user, unmount } = open()
  try {
    expect(
      screen.queryByRole('button', { name: 'Back to top' }),
    ).not.toBeInTheDocument()
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 700 })
    fireEvent.scroll(window)
    await user.click(screen.getByRole('button', { name: 'Back to top' }))
    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'instant',
    })
    expect(screen.getByRole('main')).toHaveFocus()
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    fireEvent.scroll(window)
    expect(
      screen.queryByRole('button', { name: 'Back to top' }),
    ).not.toBeInTheDocument()
    unmount()
    const subscriptions = add.mock.calls.filter(([type]) => type === 'scroll')
    expect(subscriptions.length).toBeGreaterThan(0)
    await waitFor(() => {
      for (const [, listener] of subscriptions)
        expect(remove).toHaveBeenCalledWith('scroll', listener)
    })
  } finally {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: before,
    })
  }
})

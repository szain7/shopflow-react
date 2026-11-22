// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { StrictMode } from 'react'
import { Link, MemoryRouter, useLocation, useNavigate } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '../App'
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
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[entry]}>
          <App mockScenarios={mockScenarios} />
          <NavigationControls />
        </MemoryRouter>
      </QueryClientProvider>
    </StrictMode>,
  )
  return { ...view, user: userEvent.setup(), client }
}

const searchField = () =>
  screen.getByRole('searchbox', { name: 'Search products' })

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

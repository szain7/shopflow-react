// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
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

const locationText = () => screen.getByLabelText('Location').textContent
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

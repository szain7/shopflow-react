import { formatPrice } from './components/ui/format-price'
import { useEffect, useRef } from 'react'
import {
  Link,
  matchPath,
  Route,
  Routes,
  useHref,
  useLocation,
} from 'react-router'
import { selectCartCount, selectCartTotal } from './app/store'
import { useShopSelector } from './app/store-hooks'
import {
  AccountPage,
  LoginPage,
  RequireSession,
  SessionLinks,
} from './features/auth/AuthPages'
import { CatalogPage } from './features/browse/CatalogPage'
import { MissingPage, ProductPage } from './features/browse/ProductPage'
import { CartPage } from './features/cart/CartPage'
import { OrderPage } from './features/orders/OrderPage'
import { useLiveStock } from './hooks/useLiveStock'

export default function App({
  mockScenarios = false,
  hashRouting = false,
  publicDemo = false,
}: {
  mockScenarios?: boolean
  hashRouting?: boolean
  publicDemo?: boolean
}) {
  const { pathname, search } = useLocation()
  const skipHref = useHref({ pathname, search, hash: '#main-content' })
  const previousPath = useRef(pathname)
  const main = useRef<HTMLElement>(null)
  const count = useShopSelector(selectCartCount)
  const total = useShopSelector(selectCartTotal)
  const watchesStock = ['/', '/cart', '/checkout', '/products/:id'].some(
    (path) => matchPath(path, pathname),
  )
  useLiveStock(mockScenarios && watchesStock)

  useEffect(() => {
    if (previousPath.current !== pathname) {
      main.current?.focus()
      window.scrollTo({ top: 0, behavior: 'instant' })
      previousPath.current = pathname
    }
  }, [pathname])

  return (
    <div className="min-h-screen bg-surface text-ink">
      <a
        className="sr-only rounded-md bg-brand px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:outline-2 focus:outline-offset-2 focus:outline-brand"
        href={hashRouting ? skipHref : '#main-content'}
        onClick={
          hashRouting
            ? (event) => {
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return
                event.preventDefault()
                main.current?.focus()
              }
            : undefined
        }
      >
        Skip to main content
      </a>
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link
            className="rounded-sm text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            to="/"
          >
            Shopflow
            {publicDemo && (
              <span className="ml-2 text-sm text-muted">Demo</span>
            )}
          </Link>
          <nav
            aria-label="Shop navigation"
            className="flex flex-wrap items-center gap-x-4 gap-y-1"
          >
            <Link
              className="rounded-sm py-2 font-semibold text-brand focus-visible:outline-2 focus-visible:outline-brand"
              to="/cart"
            >
              Cart ({count}){' '}
              <span className="whitespace-nowrap">{formatPrice(total)}</span>
            </Link>
            <SessionLinks />
          </nav>
        </div>
      </header>
      <main
        ref={main}
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-7xl px-5 py-8 focus-visible:outline-2 focus-visible:outline-brand sm:px-8 sm:py-12"
      >
        <Routes>
          <Route
            path="/"
            element={<CatalogPage mockScenarios={mockScenarios} />}
          />
          <Route
            path="/products/:id"
            element={<ProductPage mockScenarios={mockScenarios} />}
          />
          <Route path="/cart" element={<CartPage />} />
          <Route
            path="/login"
            element={<LoginPage showDemoCredentials={mockScenarios} />}
          />
          <Route element={<RequireSession />}>
            <Route path="/checkout" element={<CartPage checkout />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/orders/:id" element={<OrderPage />} />
          </Route>
          <Route path="*" element={<MissingPage />} />
        </Routes>
      </main>
    </div>
  )
}

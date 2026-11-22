import { useEffect, useRef } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router'
import { CatalogPage } from './features/browse/CatalogPage'
import { MissingPage, ProductPage } from './features/browse/ProductPage'

export default function App({
  mockScenarios = false,
}: {
  mockScenarios?: boolean
}) {
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)
  const main = useRef<HTMLElement>(null)

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
        href="#main-content"
      >
        Skip to main content
      </a>
      <header className="border-b border-line bg-panel">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8">
          <Link
            className="rounded-sm text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            to="/"
          >
            Shopflow
          </Link>
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
          <Route path="*" element={<MissingPage />} />
        </Routes>
      </main>
    </div>
  )
}

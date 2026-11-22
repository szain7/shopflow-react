import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { categories, categorySchema, sortSchema } from '../../api/schemas'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { BackToTop } from './BackToTop'
import { actionClass, BrowseMessage, RetryMessage } from './BrowseMessage'
import { PriceAndStock, ProductPhoto } from './ProductDisplay'
import { browseError, catalogQuery, readScenario } from './browse-queries'
import { catalogParams, readCatalogFilters, withSearch } from './catalog-url'
import type { CatalogFilters } from './catalog-url'
import { productPageSize } from '../../api/schemas'
import { useShopStore } from '../../app/store-hooks'
import { AddToCart } from '../cart/AddToCart'

const defaults = readCatalogFilters(new URLSearchParams())
const fieldClass =
  'min-h-11 w-full rounded-md border border-line bg-panel px-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const categoryLabels = {
  keyboards: 'Keyboards',
  ducks: 'Ducks',
  coffee: 'Coffee',
  stickers: 'Stickers',
}

type Scenario = ReturnType<typeof readScenario>

function focusCatalogStart(event: MouseEvent<HTMLAnchorElement>) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey
  )
    return
  document.getElementById('main-content')?.focus()
  window.scrollTo({ top: 0, behavior: 'instant' })
}

function CatalogResults({
  filters,
  scenario,
}: {
  filters: CatalogFilters
  scenario: Scenario
}) {
  const { api } = useShopStore()
  const query = useQuery(catalogQuery(api, filters, scenario))

  if (query.isPending) return <BrowseMessage>Loading products…</BrowseMessage>
  if (query.isError) {
    return (
      <RetryMessage
        message={browseError(query.error)}
        retrying={query.isFetching}
        onRetry={() => {
          void query.refetch()
        }}
      />
    )
  }

  const { items, total } = query.data
  const pages = Math.max(1, Math.ceil(total / productPageSize))
  const params = catalogParams(filters, scenario)
  const pageLink = (page: number) =>
    withSearch('/', catalogParams({ ...filters, page }, scenario))
  const pagination = filters.page > 1 || pages > 1

  return (
    <>
      <p role="status" className="mb-4 text-sm font-medium text-muted">
        {total.toLocaleString('en-US')} {total === 1 ? 'product' : 'products'}
        {pagination &&
          filters.page <= pages &&
          ` · Page ${filters.page} of ${pages}`}
      </p>
      {items.length ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((product) => (
            <li
              key={product.id}
              className="overflow-hidden rounded-xl border border-line bg-panel"
            >
              <ProductPhoto product={product} />
              <div className="p-4">
                <h2 className="font-semibold wrap-break-word">
                  <Link
                    to={withSearch(
                      `/products/${encodeURIComponent(product.id)}`,
                      params,
                    )}
                    className="rounded-sm text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {product.name}
                  </Link>
                </h2>
                <PriceAndStock price={product.price} stock={product.stock} />
                <AddToCart product={product} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <BrowseMessage>
          {filters.page > pages
            ? 'This page has no products.'
            : 'No products match your filters.'}
        </BrowseMessage>
      )}
      {pagination && (
        <nav aria-label="Product pages" className="mt-6 flex flex-wrap gap-3">
          {filters.page > pages ? (
            <Link
              to={pageLink(pages)}
              className={actionClass}
              onClick={focusCatalogStart}
            >
              Last available page
            </Link>
          ) : (
            <>
              {filters.page > 1 && (
                <Link
                  to={pageLink(filters.page - 1)}
                  className={actionClass}
                  onClick={focusCatalogStart}
                >
                  Previous page
                </Link>
              )}
              {filters.page < pages && (
                <Link
                  to={pageLink(filters.page + 1)}
                  className={actionClass}
                  onClick={focusCatalogStart}
                >
                  Next page
                </Link>
              )}
            </>
          )}
        </nav>
      )}
    </>
  )
}

export function CatalogPage({ mockScenarios }: { mockScenarios: boolean }) {
  useDocumentTitle('Shopflow')
  const [params, setParams] = useSearchParams()
  const { key } = useLocation()
  const filters = readCatalogFilters(params)
  const scenario = readScenario(params, mockScenarios)
  const canonical = catalogParams(filters, scenario).toString()
  const current = params.toString()

  useEffect(() => {
    if (canonical !== current) setParams(canonical, { replace: true })
  }, [canonical, current, setParams])

  const [draft, setDraft] = useState({
    locationKey: key,
    search: filters.search,
  })
  // A POP can revisit the same key. Discard drafts when leaving their entry.
  if (draft.locationKey !== key) {
    setDraft({ locationKey: key, search: filters.search })
  }
  const value = draft.locationKey === key ? draft.search : filters.search
  const search = value.trim()
  const pendingSearch = search !== filters.search

  function apply(changes: Partial<CatalogFilters>) {
    setParams(
      catalogParams({ ...filters, search, ...changes, page: 1 }, scenario),
    )
  }

  useDebouncedAction(search, pendingSearch, 300, (settled) =>
    apply({ search: settled }),
  )

  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Shopflow
      </h1>
      <p className="mt-2 text-lg text-muted">
        Developer gear for The Bug Bazaar.
      </p>
      <form
        aria-label="Product filters"
        className="my-6 grid gap-4 rounded-xl border border-line bg-panel p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (pendingSearch) apply({ search })
        }}
      >
        <label className="grid gap-1 text-sm font-semibold">
          Search products
          <input
            className={fieldClass}
            type="search"
            value={value}
            onChange={(event) =>
              setDraft({ locationKey: key, search: event.target.value })
            }
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Category
          <select
            className={fieldClass}
            value={filters.category ?? ''}
            onChange={(event) =>
              apply({
                category: categorySchema.safeParse(event.target.value).data,
              })
            }
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {categoryLabels[category]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Sort by
          <select
            className={fieldClass}
            value={filters.sort}
            onChange={(event) =>
              apply({ sort: sortSchema.parse(event.target.value) })
            }
          >
            <option value="name-asc">Name (A–Z)</option>
            <option value="price-asc">Price (low to high)</option>
            <option value="price-desc">Price (high to low)</option>
            <option value="rating-desc">Highest rated</option>
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            <input
              className="size-5 accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              type="checkbox"
              checked={filters.inStock}
              onChange={(event) => apply({ inStock: event.target.checked })}
            />
            In stock only
          </label>
          <button
            type="button"
            className={actionClass}
            onClick={() => {
              setDraft({ locationKey: key, search: '' })
              setParams(catalogParams(defaults, scenario))
            }}
          >
            Clear filters
          </button>
        </div>
      </form>
      {pendingSearch ? (
        <BrowseMessage>Updating search…</BrowseMessage>
      ) : (
        <CatalogResults filters={filters} scenario={scenario} />
      )}
      <BackToTop />
    </>
  )
}

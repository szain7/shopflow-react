import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router'
import { useShopStore } from '../../app/store-hooks'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { BackToTop } from './BackToTop'
import { actionClass, BrowseMessage, RetryMessage } from './BrowseMessage'
import { PriceAndStock, ProductPhoto } from './ProductDisplay'
import {
  browseError,
  isMissingProduct,
  productQuery,
  readScenario,
} from './browse-queries'
import { withSearch } from './catalog-url'
import { AddToCart } from '../cart/AddToCart'

export function MissingPage() {
  useDocumentTitle('Page not found | Shopflow')
  return (
    <>
      <h1 className="mb-4 text-3xl font-bold">Page not found</h1>
      <BrowseMessage>
        This address does not match a Shopflow page.
      </BrowseMessage>
      <Link className={`${actionClass} mt-5`} to="/">
        Browse products
      </Link>
    </>
  )
}

function ProductContent({
  id,
  mockScenarios,
}: {
  id: string
  mockScenarios: boolean
}) {
  const [search] = useSearchParams()
  const scenario = readScenario(search, mockScenarios)
  const { api } = useShopStore()
  const query = useQuery(
    productQuery(api, id, scenario === 'race' ? undefined : scenario),
  )
  const missing = query.isError && isMissingProduct(query.error)
  const title = query.isSuccess
    ? query.data.name
    : missing
      ? 'Product not found'
      : 'Product details'
  useDocumentTitle(`${title} | Shopflow`)

  return (
    <>
      <Link className={`${actionClass} mb-5`} to={withSearch('/', search)}>
        Back to products
      </Link>
      {query.isSuccess ? (
        <article className="grid overflow-hidden rounded-xl border border-line bg-panel md:grid-cols-2">
          <ProductPhoto product={query.data} eager />
          <div className="p-5 sm:p-8">
            <h1 className="text-3xl font-bold wrap-break-word sm:text-4xl">
              {title}
            </h1>
            <PriceAndStock price={query.data.price} stock={query.data.stock} />
            <AddToCart product={query.data} />
            <p className="sr-only" role="status">
              Product details loaded.
            </p>
          </div>
        </article>
      ) : (
        <>
          <h1 className="mb-4 text-3xl font-bold">{title}</h1>
          {query.isPending ? (
            <BrowseMessage>Loading product…</BrowseMessage>
          ) : missing ? (
            <BrowseMessage>This product is unavailable.</BrowseMessage>
          ) : (
            <RetryMessage
              message={browseError(query.error)}
              retrying={query.isFetching}
              onRetry={() => {
                void query.refetch()
              }}
            />
          )}
        </>
      )}
      <BackToTop />
    </>
  )
}

export function ProductPage({ mockScenarios }: { mockScenarios: boolean }) {
  const { id } = useParams()
  if (!id) return <MissingPage />
  return <ProductContent key={id} id={id} mockScenarios={mockScenarios} />
}

import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { useShopStore } from '../../app/store-hooks'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
  actionClass,
  BrowseMessage,
  RetryMessage,
} from '../browse/BrowseMessage'
import { browseError, isMissingProduct } from '../browse/browse-queries'

export function OrderPage() {
  useDocumentTitle('Order confirmation | Shopflow')
  const store = useShopStore()
  const { id = '' } = useParams()
  const order = useQuery({
    queryKey: ['private', 'order', id],
    queryFn: ({ signal }) => store.api.getOrder(id, { signal }),
    staleTime: 0,
    retry: false,
  })
  const missing = order.isError && isMissingProduct(order.error)
  return (
    <section className="max-w-xl space-y-4">
      <h1 className="text-3xl font-bold">
        {missing ? 'Order not found' : 'Order confirmation'}
      </h1>
      {order.isPending && <BrowseMessage>Loading order…</BrowseMessage>}
      {missing && <BrowseMessage>This order is unavailable.</BrowseMessage>}
      {order.isError && !missing && (
        <RetryMessage
          message={browseError(order.error)}
          retrying={order.isFetching}
          onRetry={() => {
            void order.refetch()
          }}
        />
      )}
      {order.isSuccess && (
        <div className="rounded-xl border border-line bg-panel p-5">
          <p role="status" className="font-semibold">
            {order.data.status === 'failed' ? 'Order failed' : 'Order received'}
          </p>
          <p className="break-all">Order {order.data.id}</p>
          <p className="capitalize">Status: {order.data.status}</p>
        </div>
      )}
      <Link className={actionClass} to="/">
        Continue browsing
      </Link>
    </section>
  )
}

import { formatPrice } from '../../components/ui/format-price'
import { useQueries } from '@tanstack/react-query'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiRequestError } from '../../api/client'
import type { Product } from '../../api/schemas'
import { cartActions, CheckoutError, selectCartTotal } from '../../app/store'
import type { CartLine } from '../../app/store'
import { useShopSelector, useShopStore } from '../../app/store-hooks'
import {
  focusMain,
  inputClass,
  primaryClass,
} from '../../components/ui/commerce'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { actionClass, BrowseMessage } from '../browse/BrowseMessage'
import {
  browseError,
  isMissingProduct,
  productQuery,
} from '../browse/browse-queries'

function CartRow({
  line,
  product,
  editable,
  showStockWarning,
}: {
  line: CartLine
  product?: Product
  editable: boolean
  showStockWarning: boolean
}) {
  const store = useShopStore()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const errorId = useId()
  useEffect(() => {
    if (product) {
      const { id, name, price } = product
      store.dispatch(cartActions.refreshLine({ id, name, price }))
    }
  }, [product, store])

  return (
    <div className="grid gap-3 rounded-xl border border-line bg-panel p-4 sm:grid-cols-[1fr_auto] sm:p-5">
      <div>
        <h2 className="font-semibold wrap-break-word">{line.name}</h2>
        <p>{formatPrice(line.price)} each</p>
        {showStockWarning && product && line.quantity > product.stock && (
          <p role="alert" className="text-status-error">
            Only {product.stock} available.{' '}
            {product.stock
              ? 'Reduce the quantity.'
              : 'Remove this item to continue.'}
          </p>
        )}
      </div>
      <div>
        {editable ? (
          <>
            <form
              className="flex flex-wrap items-end gap-2"
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                if (store.getState().checkout.intent) return
                setNotice('')
                const value = new FormData(event.currentTarget).get('quantity')
                const quantity = Number(value)
                if (
                  !product ||
                  typeof value !== 'string' ||
                  !/^\d+$/.test(value) ||
                  !Number.isSafeInteger(quantity) ||
                  quantity < 1 ||
                  quantity > product.stock
                ) {
                  setError(
                    product?.stock
                      ? `Enter a whole number from 1 to ${product.stock}.`
                      : 'This item is unavailable. Remove it to continue.',
                  )
                  event.currentTarget.querySelector('input')?.focus()
                  return
                }
                store.dispatch(cartActions.setQuantity({ product, quantity }))
                const saved = store
                  .getState()
                  .cart.find(({ id }) => id === product.id)?.quantity
                setError(
                  saved === quantity ? '' : 'Could not update this quantity.',
                )
                if (saved === quantity) setNotice('Quantity updated.')
              }}
            >
              <label className="grid gap-1 text-sm">
                <span>
                  Quantity<span className="sr-only"> for {line.name}</span>
                </span>
                <input
                  aria-label={`Quantity for ${line.name}`}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                  className={`${inputClass} w-24`}
                  inputMode="numeric"
                  name="quantity"
                  defaultValue={line.quantity}
                />
              </label>
              <button className={actionClass} type="submit" disabled={!product}>
                Update
              </button>
              <button
                className={actionClass}
                type="button"
                aria-label={`Remove ${line.name}`}
                onClick={() => {
                  if (store.getState().checkout.intent) return
                  focusMain()
                  store.dispatch(cartActions.remove(line.id))
                }}
              >
                Remove
              </button>
            </form>
            {error && (
              <p id={errorId} role="alert" className="mt-1 text-status-error">
                {error}
              </p>
            )}
            <p role="status" className="text-sm text-muted">
              {notice}
            </p>
          </>
        ) : (
          <p>Quantity: {line.quantity}</p>
        )}
      </div>
    </div>
  )
}

function checkoutError(error: unknown, lines: CartLine[]) {
  if (
    error instanceof ApiRequestError &&
    error.failure.kind === 'http' &&
    error.failure.stock
  ) {
    const { productId, available } = error.failure.stock
    const name = lines.find(({ id }) => id === productId)?.name ?? 'An item'
    return available
      ? `${name} has only ${available} available. Return to your cart and reduce the quantity.`
      : `${name} is out of stock. Return to your cart and remove it.`
  }
  return error instanceof CheckoutError || error instanceof ApiRequestError
    ? error.message
    : 'Could not place your order. Try again.'
}

export function CartPage({ checkout = false }: { checkout?: boolean }) {
  const title = checkout ? 'Checkout' : 'Cart'
  useDocumentTitle(`${title} | Shopflow`)
  const store = useShopStore()
  const navigate = useNavigate()
  const lines = useShopSelector((state) => state.cart)
  const total = useShopSelector(selectCartTotal)
  const { intent, submitting } = useShopSelector((state) => state.checkout)
  const userId = useShopSelector((state) => state.session?.userId)
  const [failure, setFailure] = useState('')
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const products = useQueries({
    queries: lines.map(({ id }) => ({
      ...productQuery(store.api, id),
      refetchOnMount: 'always' as const,
    })),
  })
  const blocked = products.some(
    (query, index) =>
      query.isFetching ||
      !query.isSuccess ||
      query.data.stock < (lines[index]?.quantity ?? 0),
  )
  const wrongAccount = Boolean(intent && userId && intent.ownerId !== userId)

  async function submit() {
    setFailure('')
    focusMain()
    const token = store.getState().session?.token
    try {
      const order = await store.placeOrder()
      if (
        order &&
        mounted.current &&
        token === store.getState().session?.token
      ) {
        void navigate(`/orders/${encodeURIComponent(order.id)}`, {
          replace: true,
        })
      }
    } catch (error) {
      if (mounted.current) setFailure(checkoutError(error, lines))
    }
  }

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-3xl font-bold">{title}</h1>
      {intent && (
        <BrowseMessage>
          {wrongAccount
            ? 'Sign in with the account that started this order.'
            : 'An order is pending. Resume it with the original items before editing your cart.'}
        </BrowseMessage>
      )}
      {failure && <BrowseMessage error>{failure}</BrowseMessage>}
      {!lines.length && !intent ? (
        <>
          <BrowseMessage>Your cart is empty.</BrowseMessage>
          <Link className={actionClass} to="/">
            Browse products
          </Link>
        </>
      ) : (
        <>
          <ul className="grid gap-3">
            {lines.map((line, index) => {
              const query = products[index]
              return (
                <li key={line.id} className="list-none">
                  <CartRow
                    line={line}
                    product={query?.isSuccess ? query.data : undefined}
                    editable={!checkout && !intent}
                    showStockWarning={!intent}
                  />
                  {query?.isPending && (
                    <BrowseMessage>
                      Checking stock for {line.name}…
                    </BrowseMessage>
                  )}
                  {query?.isError && (
                    <div className="mt-2 space-y-2">
                      <BrowseMessage error>
                        {isMissingProduct(query.error)
                          ? `${line.name} is no longer available. Remove it from your cart.`
                          : browseError(query.error)}
                      </BrowseMessage>
                      {!isMissingProduct(query.error) && (
                        <button
                          className={actionClass}
                          type="button"
                          onClick={() => {
                            focusMain()
                            void query.refetch()
                          }}
                        >
                          Retry stock check
                        </button>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="text-lg font-semibold">
            Cart total: {formatPrice(total)}
          </p>
          <div className="flex flex-wrap gap-3">
            {checkout ? (
              <>
                <Link className={actionClass} to="/cart">
                  Back to cart
                </Link>
                <button
                  className={primaryClass}
                  type="button"
                  disabled={
                    submitting ||
                    wrongAccount ||
                    (!intent && (blocked || !lines.length))
                  }
                  onClick={() => {
                    void submit()
                  }}
                >
                  {submitting
                    ? 'Placing order…'
                    : intent
                      ? 'Retry order'
                      : 'Place order'}
                </button>
              </>
            ) : (
              <Link className={primaryClass} to="/checkout">
                {intent ? 'Resume checkout' : 'Checkout'}
              </Link>
            )}
          </div>
        </>
      )}
    </section>
  )
}

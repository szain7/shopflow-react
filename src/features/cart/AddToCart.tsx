import { useState } from 'react'
import type { Product } from '../../api/schemas'
import { cartActions } from '../../app/store'
import { useShopSelector, useShopStore } from '../../app/store-hooks'
import { actionClass } from '../browse/BrowseMessage'

export function AddToCart({ product }: { product: Product }) {
  const store = useShopStore()
  const quantity = useShopSelector(
    ({ cart }) => cart.find(({ id }) => id === product.id)?.quantity ?? 0,
  )
  const locked = useShopSelector(({ checkout }) => Boolean(checkout.intent))
  const [message, setMessage] = useState('')

  return (
    <div className="mt-3">
      <button
        type="button"
        className={actionClass}
        aria-label={`Add ${product.name} to cart`}
        disabled={locked || quantity >= product.stock}
        onClick={() => {
          const current = store.getState()
          if (current.checkout.intent) return
          const previous =
            current.cart.find(({ id }) => id === product.id)?.quantity ?? 0
          if (previous >= product.stock) return
          store.dispatch(
            cartActions.setQuantity({ product, quantity: previous + 1 }),
          )
          const next = store
            .getState()
            .cart.find(({ id }) => id === product.id)?.quantity
          setMessage(
            next === previous + 1
              ? `${next} in cart.`
              : 'Could not add this item.',
          )
        }}
      >
        Add to cart
      </button>
      <p className="mt-1 text-sm text-muted" role="status">
        {locked
          ? 'Finish the pending checkout to edit your cart.'
          : quantity > 0 && quantity >= product.stock
            ? `${quantity} in cart. Stock limit reached.`
            : message}
      </p>
    </div>
  )
}

import { useState } from 'react'
import type { Product } from '../../api/schemas'

const placeholder = '/product-placeholder.svg'
const configuredCurrency: unknown = import.meta.env.VITE_DISPLAY_CURRENCY
const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency:
    typeof configuredCurrency === 'string'
      ? (configuredCurrency
          .trim()
          .toUpperCase()
          .match(/^[A-Z]{3}$/)?.[0] ?? 'USD')
      : 'USD',
})

function ProductImage({
  product,
  eager,
}: {
  product: Product
  eager: boolean
}) {
  const [failed, setFailed] = useState(false)
  const source = failed ? placeholder : product.imageUrl
  return (
    <img
      src={source}
      alt={source === placeholder ? '' : product.name}
      onError={() => setFailed(true)}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className="aspect-[4/3] w-full bg-surface object-contain"
    />
  )
}

export function ProductPhoto({
  product,
  eager = false,
}: {
  product: Product
  eager?: boolean
}) {
  return <ProductImage key={product.imageUrl} product={product} eager={eager} />
}

export function PriceAndStock({
  price,
  stock,
}: Pick<Product, 'price' | 'stock'>) {
  return (
    <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <p className="font-semibold tabular-nums">
        {currency.format(price / 100)}
      </p>
      <p
        className={
          stock > 0 ? 'text-sm text-status-success' : 'text-sm text-muted'
        }
      >
        {stock > 0 ? `${stock} in stock` : 'Out of stock'}
      </p>
    </div>
  )
}

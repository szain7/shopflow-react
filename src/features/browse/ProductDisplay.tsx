import { formatPrice } from '../../components/ui/format-price'
import { useState } from 'react'
import type { Product } from '../../api/schemas'
import { productPlaceholderUrl as placeholder } from '../../app/site-config'

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
      <p className="font-semibold tabular-nums">{formatPrice(price)}</p>
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

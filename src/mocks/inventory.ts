import { categories } from '../api/schemas'
import type { Product } from '../api/schemas'

const groups = [
  { category: categories[0], label: 'Mechanical Keyboard' },
  { category: categories[1], label: 'Debug Duck' },
  { category: categories[2], label: 'Developer Coffee' },
  { category: categories[3], label: 'Developer Sticker Pack' },
]

export const inventory = new Map<string, Product>(
  groups.flatMap(({ category, label }, group) =>
    Array.from({ length: 1250 }, (_, index) => {
      const id = `product-${String(index * groups.length + group + 1).padStart(4, '0')}`
      return [
        id,
        {
          id,
          category,
          name: `${label} ${String(index + 1).padStart(4, '0')}`,
          price: 299 + index * 7 + group * 300,
          stock: (index + group) % 13,
          rating: 3 + ((index + group) % 21) / 10,
          imageUrl: '/product-placeholder.svg',
        },
      ]
    }),
  ),
)

const searchRows = Array.from(inventory.values(), (product) => ({
  product,
  searchName: product.name.toLowerCase(),
}))

function sorted(compare: (a: Product, b: Product) => number) {
  return [...searchRows].sort(
    ({ product: a }, { product: b }) =>
      compare(a, b) || a.id.localeCompare(b.id),
  )
}

export const catalogOrder = {
  'name-asc': sorted((a, b) => a.name.localeCompare(b.name)),
  'price-asc': sorted((a, b) => a.price - b.price),
  'price-desc': sorted((a, b) => b.price - a.price),
  'rating-desc': sorted((a, b) => b.rating - a.rating),
}

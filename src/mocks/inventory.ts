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

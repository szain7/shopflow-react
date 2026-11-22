import { expect, test } from 'vitest'
import { createApiClient } from '../api/client'
import { state } from './server'

test('a stock drop changes filtered totals and shifts page boundaries without changing sort order', async () => {
  const api = createApiClient({ origin: 'http://shopflow.test' })
  const filters = {
    category: 'ducks',
    sort: 'price-asc',
    inStock: true,
  } as const
  const first = await api.listProducts(filters)
  const second = await api.listProducts({ ...filters, page: 2 })
  const removed = first.items[0]
  if (!removed) throw new Error('Expected a stocked duck')
  state.setBaseStock(removed.id, 0)

  const nextFirst = await api.listProducts(filters)
  const nextSecond = await api.listProducts({ ...filters, page: 2 })
  expect(nextFirst.total).toBe(first.total - 1)
  expect(nextSecond.total).toBe(nextFirst.total)
  expect(nextFirst.items).toHaveLength(24)
  expect(nextSecond.items).toHaveLength(24)
  expect([...nextFirst.items, ...nextSecond.items].slice(0, 47)).toEqual([
    ...first.items.slice(1),
    ...second.items,
  ])
  const unfiltered = await api.listProducts({ ...filters, inStock: false })
  expect(unfiltered.items.find(({ id }) => id === removed.id)?.stock).toBe(0)
})

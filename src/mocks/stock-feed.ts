import { ws } from 'msw/ws'
import { stockFeedPath, stockUpdateSchema } from '../api/stock-feed'
import { inventory } from './inventory'
import type { createMockState } from './state'

export function createStockFeed(state: ReturnType<typeof createMockState>) {
  const feed = ws.link(`*${stockFeedPath}`)
  const product = inventory.get('product-0002')
  const levels = [0, 4, 1]

  return feed.addEventListener('connection', ({ client }) => {
    if (!product) return
    let tick = 0
    const timer = setInterval(() => {
      const level = levels[tick++ % levels.length]
      if (level === undefined) return
      state.setBaseStock(product.id, level)
      const data = stockUpdateSchema.parse({
        type: 'stock',
        productId: product.id,
        stock: state.stockFor(product, state.reservedStock()),
      })
      client.send(JSON.stringify(data))
    }, 8_000)
    client.addEventListener('close', () => clearInterval(timer), { once: true })
  })
}

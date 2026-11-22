import { z } from 'zod'
import { orderBodySchema } from '../api/schemas'
import type { OrderBody } from '../api/schemas'

export const demoCredentials = {
  email: 'learner@example.test',
  password: 'shopflow-demo',
}
export const demoUser = {
  id: 'demo-user',
  name: 'Shopflow Learner',
  email: demoCredentials.email,
}

const storageKey = 'shopflow.mock-orders.v1'
const ledgerSchema = z.array(
  z.object({
    id: z.uuid(),
    owner: z.string(),
    key: z.string().min(1).max(200),
    created: z.int().nonnegative(),
    order: orderBodySchema,
  }),
)
type Ledger = z.infer<typeof ledgerSchema>

function readLedger(storage: Storage | undefined): Ledger {
  try {
    const saved = storage?.getItem(storageKey)
    return saved ? (ledgerSchema.safeParse(JSON.parse(saved)).data ?? []) : []
  } catch {
    return []
  }
}

export function createMockState(storage?: Storage) {
  const sessions = new Map<string, number>()
  let ledger = readLedger(storage)

  return {
    startSession() {
      const token = crypto.randomUUID()
      sessions.set(token, Date.now() + 30 * 60 * 1000)
      return token
    },
    isAuthorized(request: Request) {
      const token = /^Bearer (.+)$/.exec(
        request.headers.get('Authorization') ?? '',
      )?.[1]
      if (!token) return false
      const expires = sessions.get(token)
      if (expires !== undefined && expires > Date.now()) return true
      sessions.delete(token)
      return false
    },
    findSubmission(key: string) {
      return ledger.find(
        (entry) => entry.owner === demoUser.id && entry.key === key,
      )
    },
    findOrder(id: string) {
      return ledger.find(
        (entry) => entry.owner === demoUser.id && entry.id === id,
      )
    },
    reservedStock() {
      const reserved = new Map<string, number>()
      for (const { order } of ledger) {
        for (const { productId, quantity } of order.items) {
          reserved.set(productId, (reserved.get(productId) ?? 0) + quantity)
        }
      }
      return reserved
    },
    createOrder(key: string, order: OrderBody) {
      const entry = {
        id: crypto.randomUUID(),
        owner: demoUser.id,
        key,
        created: Date.now(),
        order,
      }
      const nextLedger = [...ledger, entry]
      storage?.setItem(storageKey, JSON.stringify(nextLedger))
      ledger = nextLedger
      return entry
    },
    reset() {
      sessions.clear()
      ledger = []
      storage?.removeItem(storageKey)
    },
  }
}

import { configureStore, createSelector, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { QueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { ApiRequestError, createApiClient } from '../api/client'
import { orderBodySchema } from '../api/schemas'
import type { Product } from '../api/schemas'

const cartKey = 'shopflow.cart.v1'
const intentKey = 'shopflow.checkout.v1'
const lineSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.int().nonnegative(),
  quantity: z.int().positive(),
})
const cartSchema = z
  .array(lineSchema)
  .refine(
    (lines) =>
      new Set(lines.map(({ id }) => id)).size === lines.length &&
      Number.isSafeInteger(
        lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
      ) &&
      Number.isSafeInteger(lines.reduce((sum, line) => sum + line.quantity, 0)),
  )
const intentSchema = z.object({
  key: z.uuid(),
  ownerId: z.string().min(1),
  body: orderBodySchema,
})
export type CartLine = z.infer<typeof lineSchema>
type Intent = z.infer<typeof intentSchema>
type Session = { token: string; userId: string; cacheScope: string }
export class CheckoutError extends Error {}

function read<T>(
  storage: Storage | undefined,
  key: string,
  schema: z.ZodType<T>,
) {
  try {
    const text = storage?.getItem(key)
    return text ? schema.safeParse(JSON.parse(text)).data : undefined
  } catch {
    return undefined
  }
}

export function browserStorage(name: 'localStorage' | 'sessionStorage') {
  try {
    return window[name]
  } catch {
    return undefined
  }
}

const cart = createSlice({
  name: 'cart',
  initialState: [] as CartLine[],
  reducers: {
    setQuantity(
      lines,
      {
        payload,
      }: PayloadAction<{
        product: Pick<Product, 'id' | 'name' | 'price' | 'stock'>
        quantity: number
      }>,
    ) {
      const { product, quantity } = payload
      if (
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > product.stock
      )
        return
      const candidate = [
        ...lines.filter(({ id }) => id !== product.id),
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
        },
      ]
      if (!cartSchema.safeParse(candidate).success) return
      const existing = lines.find((line) => line.id === product.id)
      if (existing) {
        existing.quantity = quantity
        existing.name = product.name
        existing.price = product.price
      } else {
        const line = candidate.at(-1)
        if (line) lines.push(line)
      }
    },
    refreshLine(
      lines,
      { payload }: PayloadAction<Pick<Product, 'id' | 'name' | 'price'>>,
    ) {
      const line = lines.find(({ id }) => id === payload.id)
      if (!line || (line.name === payload.name && line.price === payload.price))
        return
      const candidate = lines.map((item) =>
        item.id === payload.id ? { ...item, ...payload } : item,
      )
      if (!cartSchema.safeParse(candidate).success) return
      line.name = payload.name
      line.price = payload.price
    },
    remove: (lines, action: PayloadAction<string>) =>
      lines.filter(({ id }) => id !== action.payload),
    consume(lines, { payload }: PayloadAction<Intent['body']>) {
      return lines.flatMap((line) => {
        const quantity =
          line.quantity -
          (payload.items.find(({ productId }) => productId === line.id)
            ?.quantity ?? 0)
        return quantity > 0 ? [{ ...line, quantity }] : []
      })
    },
  },
})

const session = createSlice({
  name: 'session',
  initialState: null as Session | null,
  reducers: {
    signedIn: {
      prepare: (credentials: Pick<Session, 'token' | 'userId'>) => ({
        payload: { ...credentials, cacheScope: crypto.randomUUID() },
      }),
      reducer: (_state, action: PayloadAction<Session>) => action.payload,
    },
    signedOut: () => null,
  },
})

const checkout = createSlice({
  name: 'checkout',
  initialState: { intent: null as Intent | null, submitting: false },
  reducers: {
    setIntent(state, action: PayloadAction<Intent | null>) {
      state.intent = action.payload
    },
    setSubmitting(state, action: PayloadAction<boolean>) {
      state.submitting = action.payload
    },
  },
})

export const cartActions = cart.actions
export const sessionActions = session.actions

export function createShopStore(
  queryClient: QueryClient,
  cartStorage?: Storage,
  tabStorage?: Storage,
) {
  const store = configureStore({
    reducer: {
      cart: cart.reducer,
      session: session.reducer,
      checkout: checkout.reducer,
    },
    preloadedState: {
      cart: read(cartStorage, cartKey, cartSchema) ?? [],
      session: null,
      checkout: {
        intent: read(tabStorage, intentKey, intentSchema) ?? null,
        submitting: false,
      },
    },
    devTools: false,
  })
  let previousCart = store.getState().cart
  let previousSession = store.getState().session
  let savedCart: CartLine[] | undefined

  function persistCart(lines: CartLine[]) {
    if (!cartStorage) return false
    try {
      cartStorage.setItem(cartKey, JSON.stringify(lines))
      savedCart = lines
      return true
    } catch {
      return false
    }
  }

  store.subscribe(() => {
    const state = store.getState()
    if (state.session !== previousSession) {
      previousSession = state.session
      queryClient.removeQueries({ queryKey: ['private'] })
    }
    if (state.cart !== previousCart) {
      previousCart = state.cart
      persistCart(state.cart)
    }
  })

  const api = createApiClient({
    getToken: () => store.getState().session?.token,
    onUnauthorized(token) {
      if (token && token === store.getState().session?.token) {
        store.dispatch(sessionActions.signedOut())
      }
    },
  })

  function saveIntent(intent: Intent | null) {
    if (!tabStorage) return false
    try {
      if (intent) tabStorage.setItem(intentKey, JSON.stringify(intent))
      else tabStorage.removeItem(intentKey)
    } catch {
      return false
    }
    store.dispatch(checkout.actions.setIntent(intent))
    return true
  }

  async function placeOrder() {
    const {
      cart: lines,
      session: current,
      checkout: pending,
    } = store.getState()
    if (!current || pending.submitting) return
    if (pending.intent && pending.intent.ownerId !== current.userId) {
      throw new CheckoutError(
        'Sign in with the account that started this order.',
      )
    }
    if (!pending.intent && !lines.length) return
    const intent = pending.intent ?? {
      key: crypto.randomUUID(),
      ownerId: current.userId,
      body: {
        items: lines.map(({ id, quantity }) => ({ productId: id, quantity })),
      },
    }
    if (!pending.intent && !saveIntent(intent)) {
      throw new CheckoutError(
        'Checkout needs tab storage to retry safely. Enable it and try again.',
      )
    }

    store.dispatch(checkout.actions.setSubmitting(true))
    try {
      const result = await api.createOrder(intent.body, intent.key)
      store.dispatch(cartActions.consume(intent.body))
      const remaining = store.getState().cart
      if (savedCart === remaining || persistCart(remaining)) saveIntent(null)
      await queryClient.cancelQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      return result
    } catch (error) {
      if (error instanceof ApiRequestError && error.failure.kind === 'http') {
        if (error.failure.status === 409 || error.failure.status === 400)
          saveIntent(null)
        if (error.failure.status === 409) {
          const { stock } = error.failure
          if (stock) {
            const key = ['products', 'detail', stock.productId, undefined]
            await queryClient.cancelQueries({ queryKey: key, exact: true })
            queryClient.setQueryData<Product>(
              key,
              (product) => product && { ...product, stock: stock.available },
            )
          }
          void queryClient.invalidateQueries({ queryKey: ['products'] })
        }
      }
      throw error
    } finally {
      store.dispatch(checkout.actions.setSubmitting(false))
    }
  }

  return Object.assign(store, { api, placeOrder })
}

export type ShopStore = ReturnType<typeof createShopStore>
export type RootState = ReturnType<ShopStore['getState']>
export const selectCartCount = createSelector(
  [(state: RootState) => state.cart],
  (lines) => lines.reduce((sum, line) => sum + line.quantity, 0),
)
export const selectCartTotal = createSelector(
  [(state: RootState) => state.cart],
  (lines) => lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
)

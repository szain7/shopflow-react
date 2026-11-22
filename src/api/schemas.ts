import { z } from 'zod'

export const categories = ['keyboards', 'ducks', 'coffee', 'stickers'] as const
export const categorySchema = z.enum(categories)
export const sortSchema = z.enum([
  'name-asc',
  'price-asc',
  'price-desc',
  'rating-desc',
])
export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.int().nonnegative(),
  category: categorySchema,
  stock: z.int().nonnegative(),
  rating: z.number(),
  imageUrl: z.string().min(1),
})
export const productListSchema = z.object({
  items: z.array(productSchema),
  total: z.int().nonnegative(),
})
export const userSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
})
export const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})
export const loginResponseSchema = z.object({
  token: z.string().min(1),
  user: userSchema,
})
export const orderBodySchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.int().positive(),
        }),
      )
      .min(1),
  })
  .refine(
    ({ items }) =>
      new Set(items.map(({ productId }) => productId)).size === items.length,
  )
export const queuedOrderSchema = z.object({
  id: z.string().min(1),
  status: z.literal('queued'),
})
export const orderSchema = queuedOrderSchema.extend({
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
})
export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string(),
    details: z.record(z.string(), z.string()).optional(),
  }),
})

export type Product = z.infer<typeof productSchema>
export type LoginBody = z.infer<typeof loginBodySchema>
export type OrderBody = z.infer<typeof orderBodySchema>
export interface ProductFilters {
  search?: string
  category?: z.infer<typeof categorySchema>
  sort?: z.infer<typeof sortSchema>
  page?: number
  inStock?: boolean
}

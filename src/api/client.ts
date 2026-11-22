import type { z } from 'zod'
import {
  errorEnvelopeSchema,
  loginBodySchema,
  loginResponseSchema,
  orderSchema,
  orderBodySchema,
  productListSchema,
  productSchema,
  queuedOrderSchema,
  userSchema,
} from './schemas'
import type { LoginBody, OrderBody, ProductFilters } from './schemas'

interface RequestOptions {
  signal?: AbortSignal
}
interface ClientOptions {
  origin?: string
  getToken?: () => string | undefined
  onUnauthorized?: (requestToken: string | undefined) => void
}

type Failure =
  | { kind: 'aborted' }
  | { kind: 'network' }
  | { kind: 'validation' }
  | { kind: 'invalid-request' }
  | {
      kind: 'http'
      status: number
      fields?: Partial<Record<'email' | 'password', 'INVALID'>>
      stock?: { productId: string; available: number }
    }

function failureMessage(failure: Failure): string {
  switch (failure.kind) {
    case 'aborted':
      return 'Request cancelled.'
    case 'network':
      return 'Unable to connect. Check your connection and try again.'
    case 'validation':
      return 'The service returned an unexpected response.'
    case 'invalid-request':
      return 'Check your information and try again.'
    case 'http':
      switch (failure.status) {
        case 400:
          return 'Check your information and try again.'
        case 401:
          return 'Please sign in to continue.'
        case 404:
          return 'The requested item could not be found.'
        case 409:
          return 'An item no longer has enough stock.'
        default:
          return 'The service could not complete the request. Please try again.'
      }
  }
}

export class ApiRequestError extends Error {
  constructor(readonly failure: Failure) {
    super(failureMessage(failure))
    this.name = 'ApiRequestError'
  }
}

function encodeId(id: string) {
  // URL normalizes dot segments even when they are percent-encoded.
  if (!id || id === '.' || id === '..' || !id.isWellFormed()) {
    throw new ApiRequestError({ kind: 'invalid-request' })
  }
  return encodeURIComponent(id)
}

function httpFailure(status: number, payload: unknown): Failure {
  const { data } = errorEnvelopeSchema.safeParse(payload)
  const details = data?.error.details
  const failure: Extract<Failure, { kind: 'http' }> = { kind: 'http', status }
  if (status === 400 && data?.error.code === 'INVALID_LOGIN') {
    failure.fields = {}
    if (details?.email === 'INVALID') failure.fields.email = 'INVALID'
    if (details?.password === 'INVALID') failure.fields.password = 'INVALID'
  }
  const productId = details?.productId
  const available = details?.available
  if (
    status === 409 &&
    data?.error.code === 'OUT_OF_STOCK' &&
    productId &&
    /^[a-z0-9_-]{1,80}$/i.test(productId) &&
    available &&
    /^\d+$/.test(available) &&
    Number.isSafeInteger(Number(available))
  ) {
    failure.stock = { productId, available: Number(available) }
  }
  return failure
}

export function createApiClient({
  origin,
  getToken,
  onUnauthorized,
}: ClientOptions = {}) {
  async function request<T>(
    path: string,
    schema: z.ZodType<T>,
    expectedStatus: 200 | 201,
    options: RequestOptions & {
      body?: LoginBody | OrderBody
      auth?: boolean
      key?: string
    },
  ): Promise<T> {
    const token = options.auth ? getToken?.() : undefined
    const headers = new Headers({ Accept: 'application/json' })
    try {
      if (token) headers.set('Authorization', `Bearer ${token}`)
      if (options.body) headers.set('Content-Type', 'application/json')
      if (options.key !== undefined) headers.set('Idempotency-Key', options.key)
    } catch {
      throw new ApiRequestError({ kind: 'invalid-request' })
    }

    let response: Response
    try {
      response = await fetch(
        new URL(path, origin ?? globalThis.location.origin),
        {
          method: options.body ? 'POST' : 'GET',
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: options.signal,
        },
      )
    } catch (error) {
      const aborted =
        options.signal?.aborted ||
        (error instanceof Error && error.name === 'AbortError')
      throw new ApiRequestError({ kind: aborted ? 'aborted' : 'network' })
    }

    if (response.status === 401) onUnauthorized?.(token)
    let payload: unknown
    try {
      payload = await response.json()
    } catch (error) {
      if (
        options.signal?.aborted ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        throw new ApiRequestError({ kind: 'aborted' })
      }
      if (response.ok && !(error instanceof SyntaxError)) {
        throw new ApiRequestError({ kind: 'network' })
      }
    }

    if (!response.ok)
      throw new ApiRequestError(httpFailure(response.status, payload))

    const parsed = schema.safeParse(payload)
    if (response.status !== expectedStatus || !parsed.success) {
      throw new ApiRequestError({ kind: 'validation' })
    }
    return parsed.data
  }

  return {
    listProducts(filters: ProductFilters = {}, options: RequestOptions = {}) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined) params.set(key, String(value))
      }
      const query = params.toString()
      return request(
        `/api/products${query ? `?${query}` : ''}`,
        productListSchema,
        200,
        options,
      )
    },
    async getProduct(id: string, options: RequestOptions = {}) {
      return request(
        `/api/products/${encodeId(id)}`,
        productSchema,
        200,
        options,
      )
    },
    async login(body: LoginBody, options: RequestOptions = {}) {
      const parsed = loginBodySchema.safeParse(body)
      if (!parsed.success)
        throw new ApiRequestError({ kind: 'invalid-request' })
      return request('/api/login', loginResponseSchema, 200, {
        ...options,
        body: parsed.data,
      })
    },
    getMe(options: RequestOptions = {}) {
      return request('/api/me', userSchema, 200, { ...options, auth: true })
    },
    async createOrder(
      body: OrderBody,
      key: string,
      options: RequestOptions = {},
    ) {
      const parsed = orderBodySchema.safeParse(body)
      const submissionKey = key.trim()
      if (!parsed.success || !submissionKey || submissionKey.length > 200) {
        throw new ApiRequestError({ kind: 'invalid-request' })
      }
      return request('/api/orders', queuedOrderSchema, 201, {
        ...options,
        auth: true,
        body: parsed.data,
        key: submissionKey,
      })
    },
    async getOrder(id: string, options: RequestOptions = {}) {
      return request(`/api/orders/${encodeId(id)}`, orderSchema, 200, {
        ...options,
        auth: true,
      })
    },
  }
}

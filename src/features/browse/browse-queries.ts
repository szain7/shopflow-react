import { queryOptions } from '@tanstack/react-query'
import { ApiRequestError, createApiClient } from '../../api/client'
import type { ProductMockScenario } from '../../api/client'
import type { CatalogFilters } from './catalog-url'

const api = createApiClient()
const staleTime = 30_000

export function readScenario(params: URLSearchParams, enabled: boolean) {
  if (!enabled) return
  const value = params.get('mock')
  switch (value) {
    case 'slow':
    case 'empty':
    case 'server-error':
    case 'malformed':
    case 'invalid-data':
    case 'race':
      return value
  }
}

export function catalogQuery(
  filters: CatalogFilters,
  scenario?: ProductMockScenario | 'race',
) {
  const effectiveFilters = { ...filters, search: filters.search.toLowerCase() }
  const mockScenario =
    scenario === 'race'
      ? effectiveFilters.search === 'duck'
        ? 'slow'
        : undefined
      : scenario

  return queryOptions({
    queryKey: ['products', 'list', effectiveFilters, scenario],
    queryFn: ({ signal }) =>
      api.listProducts(effectiveFilters, { signal, mockScenario }),
    staleTime,
    retry: false,
  })
}

export function productQuery(id: string, mockScenario?: ProductMockScenario) {
  return queryOptions({
    queryKey: ['products', 'detail', id, mockScenario],
    queryFn: ({ signal }) => api.getProduct(id, { signal, mockScenario }),
    staleTime,
    retry: false,
  })
}

export function isMissingProduct(error: Error) {
  return (
    error instanceof ApiRequestError &&
    ((error.failure.kind === 'http' && error.failure.status === 404) ||
      error.failure.kind === 'invalid-request')
  )
}

export function browseError(error: Error) {
  return error instanceof ApiRequestError
    ? error.message
    : 'Something went wrong. Please try again.'
}

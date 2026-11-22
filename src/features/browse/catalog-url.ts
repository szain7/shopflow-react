import { categorySchema, sortSchema } from '../../api/schemas'
import type { ProductFilters } from '../../api/schemas'

export type CatalogFilters = Pick<ProductFilters, 'category'> &
  Required<Omit<ProductFilters, 'category'>>

export function readCatalogFilters(params: URLSearchParams): CatalogFilters {
  const rawPage = params.get('page') ?? ''
  const page = Number(rawPage)
  return {
    search: (params.get('search') ?? '').trim(),
    category: categorySchema.safeParse(params.get('category')).data,
    sort: sortSchema.safeParse(params.get('sort')).data ?? 'name-asc',
    inStock: params.get('inStock') === 'true',
    page:
      /^\d+$/.test(rawPage) && Number.isSafeInteger(page) && page > 0
        ? page
        : 1,
  }
}

export function catalogParams(filters: CatalogFilters, scenario?: string) {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.category) params.set('category', filters.category)
  if (filters.inStock) params.set('inStock', 'true')
  if (filters.sort !== 'name-asc') params.set('sort', filters.sort)
  if (filters.page !== 1) params.set('page', String(filters.page))
  if (scenario) params.set('mock', scenario)
  return params
}

export function withSearch(path: string, search: URLSearchParams) {
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

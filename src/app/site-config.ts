export function sitePath(path: string, base = import.meta.env.BASE_URL) {
  return base + path.replace(/^\//, '')
}

export const productPlaceholderUrl = sitePath('product-placeholder.svg')

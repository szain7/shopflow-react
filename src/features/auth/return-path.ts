export function safeReturnPath(value: string | null) {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  )
    return '/'
  const url = new URL(value, 'https://shopflow.invalid')
  if (url.origin !== 'https://shopflow.invalid') return '/'
  if (
    url.pathname !== '/account' &&
    url.pathname !== '/checkout' &&
    !/^\/orders\/[^/]+$/.test(url.pathname)
  )
    return '/'
  return url.pathname + url.search + url.hash
}

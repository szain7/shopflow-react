const configuredCurrency: unknown = import.meta.env.VITE_DISPLAY_CURRENCY
const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency:
    typeof configuredCurrency === 'string'
      ? (configuredCurrency
          .trim()
          .toUpperCase()
          .match(/^[A-Z]{3}$/)?.[0] ?? 'USD')
      : 'USD',
})

export function formatPrice(cents: number) {
  return currency.format(cents / 100)
}

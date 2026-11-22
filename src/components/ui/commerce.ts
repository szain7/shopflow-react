export const inputClass =
  'min-h-11 rounded-md border border-line bg-panel px-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60'

export const primaryClass =
  'inline-flex min-h-11 items-center justify-center rounded-md bg-brand px-4 py-2 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60'

export function focusMain() {
  document.getElementById('main-content')?.focus({ preventScroll: true })
}

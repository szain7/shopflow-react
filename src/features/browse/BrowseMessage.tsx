import type { ReactNode } from 'react'

export const actionClass =
  'inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-panel px-4 py-2 font-semibold text-brand hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60'

export function BrowseMessage({
  children,
  error = false,
}: {
  children: ReactNode
  error?: boolean
}) {
  return (
    <div className="rounded-xl border border-line bg-panel p-6">
      <p
        role={error ? 'alert' : 'status'}
        className={error ? 'text-status-error' : 'text-muted'}
      >
        {children}
      </p>
    </div>
  )
}

export function RetryMessage({
  message,
  onRetry,
  retrying,
}: {
  message: string
  onRetry: () => void
  retrying: boolean
}) {
  return (
    <section className="space-y-3">
      <BrowseMessage error>{message}</BrowseMessage>
      <button
        className={actionClass}
        type="button"
        onClick={onRetry}
        disabled={retrying}
      >
        {retrying ? 'Retrying…' : 'Try again'}
      </button>
    </section>
  )
}

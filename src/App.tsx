export default function App() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <a
        className="sr-only rounded-md bg-brand px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:outline-2 focus:outline-offset-2 focus:outline-brand"
        href="#main-content"
      >
        Skip to main content
      </a>
      <header className="border-b border-line bg-panel">
        <div className="mx-auto max-w-5xl px-5 py-5 text-lg font-semibold sm:px-8">
          Shopflow
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-5xl px-5 py-16 focus-visible:outline-2 focus-visible:outline-brand sm:px-8 sm:py-24"
      >
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Shopflow
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
          A developer gear storefront built for The Bug Bazaar assignment.
        </p>
      </main>
    </div>
  )
}

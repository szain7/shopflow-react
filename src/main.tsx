import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter, HashRouter } from 'react-router'
import App from './App'
import { RenderBoundary } from './app/RenderBoundary'
import { reportRenderFailure } from './app/render-monitor'
import { sitePath } from './app/site-config'
import { browserStorage, createShopStore } from './app/store'
import './styles/app.css'

async function bootstrap() {
  const publicDemo = import.meta.env.VITE_PUBLIC_DEMO === 'true'
  const hashRouting = import.meta.env.MODE === 'pages'
  const Router = hashRouting ? HashRouter : BrowserRouter
  const mockScenarios =
    publicDemo ||
    (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === 'true')
  if (mockScenarios) {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      serviceWorker: {
        url: sitePath('mockServiceWorker.js'),
        options: { scope: import.meta.env.BASE_URL },
      },
      onUnhandledFrame: 'bypass',
      quiet: true,
    })
  }

  const container = document.getElementById('root')
  if (!container) throw new Error('Shopflow root element is missing.')

  const queryClient = new QueryClient()
  const store = createShopStore(
    queryClient,
    browserStorage('localStorage'),
    browserStorage('sessionStorage'),
  )
  createRoot(container, {
    // The boundary logs a sanitized event for caught errors.
    onCaughtError: () => undefined,
    onUncaughtError: reportRenderFailure,
  }).render(
    <StrictMode>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <Router>
            <RenderBoundary>
              <App
                mockScenarios={mockScenarios}
                hashRouting={hashRouting}
                publicDemo={publicDemo}
              />
            </RenderBoundary>
          </Router>
        </QueryClientProvider>
      </Provider>
    </StrictMode>,
  )
}

void bootstrap().catch(() => {
  const status = document.getElementById('startup-status')
  if (status)
    status.textContent =
      'Shopflow could not start. Check your setup and reload.'
})

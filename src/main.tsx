import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router'
import App from './App'
import { browserStorage, createShopStore } from './app/store'
import './styles/app.css'

async function bootstrap() {
  const mockScenarios =
    import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === 'true'
  if (mockScenarios) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledFrame: 'bypass', quiet: true })
  }

  const container = document.getElementById('root')
  if (!container) throw new Error('Shopflow root element is missing.')

  const queryClient = new QueryClient()
  const store = createShopStore(
    queryClient,
    browserStorage('localStorage'),
    browserStorage('sessionStorage'),
  )
  createRoot(container).render(
    <StrictMode>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App mockScenarios={mockScenarios} />
          </BrowserRouter>
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

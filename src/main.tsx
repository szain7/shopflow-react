import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
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

  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={new QueryClient()}>
        <BrowserRouter>
          <App mockScenarios={mockScenarios} />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  )
}

void bootstrap().catch(() => {
  const status = document.getElementById('startup-status')
  if (status)
    status.textContent =
      'Shopflow could not start. Check your setup and reload.'
})

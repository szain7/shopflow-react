import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/app.css'

async function bootstrap() {
  const container = document.getElementById('root')
  if (!container) throw new Error('Shopflow root element is missing.')

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap().catch(() => {
  const status = document.getElementById('startup-status')
  if (status)
    status.textContent =
      'Shopflow could not start. Check your setup and reload.'
})

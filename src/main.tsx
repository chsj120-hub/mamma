import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import { installErrorReporting } from './lib/feedback'
import { startAnalytics } from './lib/analytics'
import { registerServiceWorker } from './lib/pwa'

registerServiceWorker()
installErrorReporting()
startAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

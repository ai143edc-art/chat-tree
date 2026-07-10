import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { LangProvider } from './lib/i18n.tsx'
import { initAnalytics } from './lib/analytics.ts'
import { watchForNewBuild } from './lib/appUpdate.ts'

watchForNewBuild()
initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LangProvider>
        <App />
      </LangProvider>
    </ErrorBoundary>
  </StrictMode>,
)

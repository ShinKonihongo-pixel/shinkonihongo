import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import './lib/i18n'
import { router } from './router'
import { initSentry } from './lib/sentry'
import { initAnalytics } from './lib/analytics'

initSentry()
initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Lab from './Lab.jsx'
import './lab.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Lab />
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* Online use and local saved state remain available. */
    }),
  )
}

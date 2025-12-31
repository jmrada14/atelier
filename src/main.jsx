import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CollectorProvider } from './context/CollectorContext'
import App from './App'
import './index.css'

// Import scraper for console testing (exposes window.openCallsScraper)
import './services/openCallsScraper'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CollectorProvider>
        <App />
      </CollectorProvider>
    </BrowserRouter>
  </StrictMode>,
)

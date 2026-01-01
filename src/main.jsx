import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { AuthProvider } from './context/AuthContext'
import { CollectorProvider } from './context/CollectorContext'
import App from './App'
import './index.css'

// Import scraper for console testing (exposes window.openCallsScraper)
import './services/openCallsScraper'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <AuthProvider>
          <CollectorProvider>
            <App />
          </CollectorProvider>
        </AuthProvider>
      </BrowserRouter>
    </ConvexProvider>
  </StrictMode>,
)

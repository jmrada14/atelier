import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Materials from './pages/Materials'
import Inventory from './pages/Inventory'
import Collectors from './pages/Collectors'
import Reminders from './pages/Reminders'
import Newsletter from './pages/Newsletter'
import OpenCallsFinder from './pages/OpenCallsFinder'

function App() {
  const location = useLocation()

  return (
    <div className="app">
      <nav>
        <div className="nav-brand">
          <Link to="/">
            <h1>Atelier</h1>
          </Link>
          <span>studio companion</span>
        </div>
        <div className="nav-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Studio
          </Link>
          <Link to="/inventory" className={location.pathname === '/inventory' ? 'active' : ''}>
            Inventory
          </Link>
          <Link to="/materials" className={location.pathname === '/materials' ? 'active' : ''}>
            Materials
          </Link>
          <Link to="/collectors" className={location.pathname === '/collectors' ? 'active' : ''}>
            Contacts
          </Link>
          <Link to="/reminders" className={location.pathname === '/reminders' ? 'active' : ''}>
            Reminders
          </Link>
          <Link to="/newsletter" className={location.pathname === '/newsletter' ? 'active' : ''}>
            Newsletter
          </Link>
          <Link to="/open-calls" className={location.pathname === '/open-calls' ? 'active' : ''}>
            Open Calls
          </Link>
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/collectors" element={<Collectors />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/newsletter" element={<Newsletter />} />
          <Route path="/open-calls" element={<OpenCallsFinder />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

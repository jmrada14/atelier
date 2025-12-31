import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Materials from './pages/Materials'
import Inventory from './pages/Inventory'

function App() {
  return (
    <div className="app">
      <nav>
        <div className="nav-brand">
          <h1>Atelier</h1>
          <span>studio companion</span>
        </div>
        <div className="nav-links">
          <Link to="/">Studio</Link>
          <Link to="/inventory">Inventory</Link>
          <Link to="/materials">Materials</Link>
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/materials" element={<Materials />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

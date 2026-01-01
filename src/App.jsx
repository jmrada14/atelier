import { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DataMigration from './components/DataMigration'
import Dashboard from './pages/Dashboard'
import Materials from './pages/Materials'
import Inventory from './pages/Inventory'
import Collectors from './pages/Collectors'
import Reminders from './pages/Reminders'
import Newsletter from './pages/Newsletter'
import OpenCallsFinder from './pages/OpenCallsFinder'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  const location = useLocation()
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Loading your studio...</p>
      </div>
    )
  }

  // Auth pages (no nav)
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    )
  }

  return (
    <div className="app">
      <nav className={mobileMenuOpen ? 'nav-open' : ''}>
        <div className="nav-header">
          <div className="nav-brand">
            <Link to="/">
              <h1>Atelier</h1>
            </Link>
            <span>studio companion</span>
          </div>
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
        <div className={`nav-menu ${mobileMenuOpen ? 'nav-menu--open' : ''}`}>
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
          {isAuthenticated && (
            <div className="user-menu">
              <div className="user-info">
                <div className="user-avatar">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span>{user?.name}</span>
              </div>
              <button className="logout-btn" onClick={logout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </nav>
      {mobileMenuOpen && <div className="nav-overlay" onClick={() => setMobileMenuOpen(false)} />}
      <main>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/materials" element={<ProtectedRoute><Materials /></ProtectedRoute>} />
          <Route path="/collectors" element={<ProtectedRoute><Collectors /></ProtectedRoute>} />
          <Route path="/reminders" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
          <Route path="/newsletter" element={<ProtectedRoute><Newsletter /></ProtectedRoute>} />
          <Route path="/open-calls" element={<ProtectedRoute><OpenCallsFinder /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </main>
      {isAuthenticated && <DataMigration />}
    </div>
  )
}

export default App

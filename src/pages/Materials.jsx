import { useState, useEffect } from 'react'

const CATEGORIES = [
  { key: 'paints', label: 'Paints & Pigments', icon: '🎨' },
  { key: 'brushes', label: 'Brushes & Tools', icon: '🖌️' },
  { key: 'surfaces', label: 'Surfaces & Canvas', icon: '🖼️' },
  { key: 'mediums', label: 'Mediums & Solvents', icon: '💧' },
  { key: 'other', label: 'Other Supplies', icon: '📦' },
]

function Materials() {
  const [inventory, setInventory] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [newItem, setNewItem] = useState('')
  const [newCategory, setNewCategory] = useState('other')
  const [activeTab, setActiveTab] = useState('inventory')
  const [filterCategory, setFilterCategory] = useState('all')

  useEffect(() => {
    const savedInventory = localStorage.getItem('artInventory')
    const savedWishlist = localStorage.getItem('artWishlist')
    if (savedInventory) setInventory(JSON.parse(savedInventory))
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist))
  }, [])

  useEffect(() => {
    localStorage.setItem('artInventory', JSON.stringify(inventory))
  }, [inventory])

  useEffect(() => {
    localStorage.setItem('artWishlist', JSON.stringify(wishlist))
  }, [wishlist])

  const addItem = (e) => {
    e.preventDefault()
    if (!newItem.trim()) return

    const item = {
      id: Date.now(),
      name: newItem.trim(),
      category: newCategory,
      addedAt: new Date().toISOString()
    }

    if (activeTab === 'inventory') {
      setInventory([item, ...inventory])
    } else {
      setWishlist([item, ...wishlist])
    }
    setNewItem('')
  }

  const removeItem = (id, list) => {
    if (list === 'inventory') {
      setInventory(inventory.filter(item => item.id !== id))
    } else {
      setWishlist(wishlist.filter(item => item.id !== id))
    }
  }

  const moveToInventory = (item) => {
    setWishlist(wishlist.filter(w => w.id !== item.id))
    setInventory([{ ...item, id: Date.now(), addedAt: new Date().toISOString() }, ...inventory])
  }

  const currentList = activeTab === 'inventory' ? inventory : wishlist
  const filteredList = filterCategory === 'all'
    ? currentList
    : currentList.filter(item => item.category === filterCategory)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getCategoryInfo = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[4]

  // Group items by category for display
  const groupedItems = filteredList.reduce((acc, item) => {
    const cat = item.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="materials-page">
      <header style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '500', marginBottom: 'var(--space-xs)' }}>
          Art Materials
        </h1>
        <p style={{ color: 'var(--graphite)', fontStyle: 'italic' }}>
          Track your supplies and wishlist
        </p>
      </header>

      <div className="materials-tabs">
        <button
          className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <span style={{ marginRight: '6px' }}>📦</span>
          My Supplies ({inventory.length})
        </button>
        <button
          className={`tab ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('wishlist')}
        >
          <span style={{ marginRight: '6px' }}>⭐</span>
          Wishlist ({wishlist.length})
        </button>
      </div>

      <form className="materials-form" onSubmit={addItem}>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={activeTab === 'inventory' ? 'Add a supply you have...' : 'Add something you want...'}
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          style={{
            padding: '0.875rem var(--space-md)',
            border: '1px solid var(--linen)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--canvas)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            minWidth: '160px',
          }}
        >
          {CATEGORIES.map(cat => (
            <option key={cat.key} value={cat.key}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
        <button type="submit">Add</button>
      </form>

      {/* Category filter pills */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-xs)',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setFilterCategory('all')}
          style={{
            padding: 'var(--space-xs) var(--space-md)',
            border: filterCategory === 'all' ? '1px solid var(--charcoal)' : '1px solid var(--linen)',
            borderRadius: 'var(--radius-full)',
            background: filterCategory === 'all' ? 'var(--ink)' : 'var(--canvas)',
            color: filterCategory === 'all' ? 'var(--canvas)' : 'var(--graphite)',
            fontSize: '0.8125rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          All
        </button>
        {CATEGORIES.map(cat => {
          const count = currentList.filter(i => i.category === cat.key).length
          if (count === 0) return null
          return (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              style={{
                padding: 'var(--space-xs) var(--space-md)',
                border: filterCategory === cat.key ? '1px solid var(--charcoal)' : '1px solid var(--linen)',
                borderRadius: 'var(--radius-full)',
                background: filterCategory === cat.key ? 'var(--ink)' : 'var(--canvas)',
                color: filterCategory === cat.key ? 'var(--canvas)' : 'var(--graphite)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span style={{
                marginLeft: '4px',
                opacity: 0.7,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem'
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="materials-list">
        {filteredList.length === 0 ? (
          <p className="empty-message">
            {currentList.length === 0 ? (
              activeTab === 'inventory'
                ? 'No supplies in your inventory yet. Start adding what you have!'
                : 'Your wishlist is empty. Add materials you want to get!'
            ) : (
              'No items in this category.'
            )}
          </p>
        ) : (
          filteredList.map(item => {
            const catInfo = getCategoryInfo(item.category)
            return (
              <div key={item.id} className="material-item">
                <div className="material-info">
                  <span className="material-name">
                    <span style={{ marginRight: '8px' }}>{catInfo.icon}</span>
                    {item.name}
                  </span>
                  <span className="material-date">
                    Added {formatDate(item.addedAt)}
                  </span>
                </div>
                <div className="material-actions">
                  {activeTab === 'wishlist' && (
                    <button
                      className="action-btn got-it"
                      onClick={() => moveToInventory(item)}
                      title="Got it! Move to inventory"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      Got it!
                    </button>
                  )}
                  <button
                    className="action-btn remove"
                    onClick={() => removeItem(item.id, activeTab)}
                    title="Remove"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Stats summary */}
      {currentList.length > 0 && (
        <div style={{
          marginTop: 'var(--space-xl)',
          padding: 'var(--space-lg)',
          background: 'var(--aged-paper)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
        }}>
          {CATEGORIES.map(cat => {
            const count = currentList.filter(i => i.category === cat.key).length
            if (count === 0) return null
            return (
              <div key={cat.key} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{cat.icon}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--ink)' }}>{count}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--graphite)' }}>{cat.label}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Materials

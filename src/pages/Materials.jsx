import { useState, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { key: 'paints', label: 'Paints & Pigments', icon: '🎨' },
  { key: 'brushes', label: 'Brushes & Tools', icon: '🖌️' },
  { key: 'surfaces', label: 'Surfaces & Canvas', icon: '🖼️' },
  { key: 'mediums', label: 'Mediums & Solvents', icon: '💧' },
  { key: 'other', label: 'Other Supplies', icon: '📦' },
]

const POPULAR_SUPPLIERS = [
  { name: 'Blick Art Materials', url: 'https://www.dickblick.com/search/?q=' },
  { name: 'Jerry\'s Artarama', url: 'https://www.jerrysartarama.com/search?q=' },
  { name: 'Utrecht', url: 'https://www.utrechtart.com/search?q=' },
  { name: 'Amazon', url: 'https://www.amazon.com/s?k=' },
  { name: 'Jackson\'s Art', url: 'https://www.jacksonsart.com/search/?q=' },
]

const PAINT_BRANDS = [
  'Golden', 'Liquitex', 'Winsor & Newton', 'Gamblin', 'Old Holland',
  'Sennelier', 'Daniel Smith', 'M. Graham', 'Holbein', 'Williamsburg',
  'Utrecht', 'Grumbacher', 'Schmincke', 'Rembrandt', 'Other'
]

function Materials() {
  const { sessionToken } = useAuth()
  const [activeTab, setActiveTab] = useState('inventory')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state for add/edit modal
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    quantity: 1,
    lowStockThreshold: 1,
    brand: '',
    colorCode: '',
    size: '',
    cost: '',
    purchaseDate: '',
    purchaseLink: '',
    notes: '',
  })

  // Convex queries and mutations
  const allMaterials = useQuery(
    api.materials.list,
    sessionToken ? { sessionToken } : "skip"
  ) || []

  const createMaterial = useMutation(api.materials.create)
  const updateMaterial = useMutation(api.materials.update)
  const removeMaterial = useMutation(api.materials.remove)

  // Split materials into inventory and wishlist
  const inventory = allMaterials.filter(m => !m.isWishlist)
  const wishlist = allMaterials.filter(m => m.isWishlist)

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'other',
      quantity: 1,
      lowStockThreshold: 1,
      brand: '',
      colorCode: '',
      size: '',
      cost: '',
      purchaseDate: '',
      purchaseLink: '',
      notes: '',
    })
    setEditingItem(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowAddModal(true)
  }

  const openEditModal = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      category: item.category || 'other',
      quantity: item.quantity || 1,
      lowStockThreshold: item.minQuantity || 1,
      brand: item.brand || '',
      colorCode: item.color || '',
      size: item.unit || '',
      cost: item.price || '',
      purchaseDate: item.lastPurchased ? new Date(item.lastPurchased).toISOString().split('T')[0] : '',
      purchaseLink: item.purchaseUrl || '',
      notes: item.notes || '',
    })
    setShowAddModal(true)
  }

  const handleSaveItem = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSaving(true)
    try {
      const materialData = {
        sessionToken,
        name: formData.name.trim(),
        category: formData.category,
        brand: formData.brand || undefined,
        color: formData.colorCode || undefined,
        quantity: Number(formData.quantity) || 1,
        unit: formData.size || undefined,
        minQuantity: Number(formData.lowStockThreshold) || 1,
        purchaseUrl: formData.purchaseLink || undefined,
        price: formData.cost ? Number(formData.cost) : undefined,
        isWishlist: activeTab === 'wishlist',
        notes: formData.notes || undefined,
      }

      if (editingItem) {
        await updateMaterial({
          ...materialData,
          id: editingItem.id,
          lastPurchased: formData.purchaseDate ? new Date(formData.purchaseDate).getTime() : undefined,
        })
      } else {
        await createMaterial(materialData)
      }

      setShowAddModal(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save material:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const removeItem = async (id) => {
    try {
      await removeMaterial({ sessionToken, id })
    } catch (error) {
      console.error('Failed to remove material:', error)
    }
  }

  const moveToInventory = async (item) => {
    try {
      await updateMaterial({
        sessionToken,
        id: item.id,
        isWishlist: false,
      })
    } catch (error) {
      console.error('Failed to move to inventory:', error)
    }
  }

  const updateQuantity = async (id, delta) => {
    const item = inventory.find(i => i.id === id)
    if (!item) return

    const newQty = Math.max(0, (item.quantity || 1) + delta)
    try {
      await updateMaterial({
        sessionToken,
        id,
        quantity: newQty,
      })
    } catch (error) {
      console.error('Failed to update quantity:', error)
    }
  }

  // Calculate stats
  const stats = useMemo(() => {
    const lowStock = inventory.filter(item =>
      (item.quantity || 1) <= (item.minQuantity || 1)
    )
    const totalValue = inventory.reduce((sum, item) =>
      sum + ((item.price || 0) * (item.quantity || 1)), 0
    )
    const totalItems = inventory.reduce((sum, item) => sum + (item.quantity || 1), 0)

    return { lowStock, totalValue, totalItems }
  }, [inventory])

  const currentList = activeTab === 'inventory' ? inventory : wishlist
  const filteredList = useMemo(() => {
    let result = currentList

    if (filterCategory !== 'all') {
      result = result.filter(item => item.category === filterCategory)
    }

    if (showLowStockOnly && activeTab === 'inventory') {
      result = result.filter(item =>
        (item.quantity || 1) <= (item.minQuantity || 1)
      )
    }

    return result
  }, [currentList, filterCategory, showLowStockOnly, activeTab])

  const formatDate = (timestamp) => {
    if (!timestamp) return null
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatCurrency = (amount) => {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const getCategoryInfo = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[4]

  const isLowStock = (item) => (item.quantity || 1) <= (item.minQuantity || 1)

  const getSearchUrl = (item, supplier) => {
    const searchTerm = encodeURIComponent(`${item.brand || ''} ${item.name}`.trim())
    return `${supplier.url}${searchTerm}`
  }

  return (
    <div className="materials-page">
      <header style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '500', marginBottom: 'var(--space-xs)' }}>
          Art Materials
        </h1>
        <p style={{ color: 'var(--graphite)', fontStyle: 'italic' }}>
          Track your supplies, expenses, and wishlist
        </p>
      </header>

      {/* Low Stock Alert Banner */}
      {stats.lowStock.length > 0 && activeTab === 'inventory' && (
        <div className="low-stock-alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>
            <strong>{stats.lowStock.length} item{stats.lowStock.length !== 1 ? 's' : ''}</strong> running low:
            {' '}{stats.lowStock.slice(0, 3).map(i => i.name).join(', ')}
            {stats.lowStock.length > 3 && ` and ${stats.lowStock.length - 3} more`}
          </span>
          <button onClick={() => setShowLowStockOnly(!showLowStockOnly)}>
            {showLowStockOnly ? 'Show All' : 'View'}
          </button>
        </div>
      )}

      {/* Stats Summary */}
      {activeTab === 'inventory' && inventory.length > 0 && (
        <div className="materials-stats">
          <div className="stat-card">
            <span className="stat-value">{stats.totalItems}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{inventory.length}</span>
            <span className="stat-label">Unique Products</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{formatCurrency(stats.totalValue) || '$0'}</span>
            <span className="stat-label">Inventory Value</span>
          </div>
          <div className="stat-card warning">
            <span className="stat-value">{stats.lowStock.length}</span>
            <span className="stat-label">Low Stock</span>
          </div>
        </div>
      )}

      <div className="materials-tabs">
        <button
          className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => { setActiveTab('inventory'); setShowLowStockOnly(false) }}
        >
          <span style={{ marginRight: '6px' }}>📦</span>
          My Supplies ({inventory.length})
        </button>
        <button
          className={`tab ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => { setActiveTab('wishlist'); setShowLowStockOnly(false) }}
        >
          <span style={{ marginRight: '6px' }}>⭐</span>
          Wishlist ({wishlist.length})
        </button>
      </div>

      {/* Add Button and Filters */}
      <div className="materials-toolbar">
        <button className="add-material-btn" onClick={openAddModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add {activeTab === 'inventory' ? 'Supply' : 'to Wishlist'}
        </button>

        {/* Category filter pills */}
        <div className="category-filters">
          <button
            onClick={() => setFilterCategory('all')}
            className={`filter-pill ${filterCategory === 'all' ? 'active' : ''}`}
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
                className={`filter-pill ${filterCategory === cat.key ? 'active' : ''}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="filter-count">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="materials-list">
        {filteredList.length === 0 ? (
          <p className="empty-message">
            {currentList.length === 0 ? (
              activeTab === 'inventory'
                ? 'No supplies in your inventory yet. Start adding what you have!'
                : 'Your wishlist is empty. Add materials you want to get!'
            ) : (
              showLowStockOnly
                ? 'No low stock items in this category.'
                : 'No items in this category.'
            )}
          </p>
        ) : (
          filteredList.map(item => {
            const catInfo = getCategoryInfo(item.category)
            const lowStock = isLowStock(item) && activeTab === 'inventory'

            return (
              <div key={item.id} className={`material-item ${lowStock ? 'low-stock' : ''}`}>
                <div className="material-main">
                  <div className="material-icon">{catInfo.icon}</div>
                  <div className="material-info">
                    <div className="material-name-row">
                      <span className="material-name">{item.name}</span>
                      {item.brand && <span className="material-brand">{item.brand}</span>}
                      {lowStock && (
                        <span className="low-stock-badge">Low Stock</span>
                      )}
                    </div>
                    <div className="material-details">
                      {item.color && (
                        <span className="material-detail">
                          <span
                            className="color-swatch"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.color}
                        </span>
                      )}
                      {item.unit && (
                        <span className="material-detail">{item.unit}</span>
                      )}
                      {item.price && (
                        <span className="material-detail cost">
                          {formatCurrency(item.price)}
                          {activeTab === 'inventory' && item.quantity > 1 && (
                            <span className="total-cost">
                              ({formatCurrency(item.price * item.quantity)} total)
                            </span>
                          )}
                        </span>
                      )}
                      {item.lastPurchased && (
                        <span className="material-detail date">
                          Purchased {formatDate(item.lastPurchased)}
                        </span>
                      )}
                    </div>
                    {item.notes && (
                      <div className="material-notes">{item.notes}</div>
                    )}
                  </div>
                </div>

                {activeTab === 'inventory' && (
                  <div className="material-quantity">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, -1)}
                      disabled={item.quantity <= 0}
                    >
                      −
                    </button>
                    <span className={`qty-value ${lowStock ? 'low' : ''}`}>
                      {item.quantity || 1}
                    </span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      +
                    </button>
                  </div>
                )}

                <div className="material-actions">
                  {/* Purchase Links Dropdown */}
                  <div className="purchase-dropdown">
                    <button className="action-btn purchase" title="Buy more">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                      </svg>
                    </button>
                    <div className="purchase-menu">
                      <div className="purchase-menu-header">Buy from:</div>
                      {item.purchaseUrl && (
                        <a
                          href={item.purchaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="purchase-link saved"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                          </svg>
                          Saved Link
                        </a>
                      )}
                      {POPULAR_SUPPLIERS.map(supplier => (
                        <a
                          key={supplier.name}
                          href={getSearchUrl(item, supplier)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="purchase-link"
                        >
                          {supplier.name}
                        </a>
                      ))}
                    </div>
                  </div>

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
                    className="action-btn edit"
                    onClick={() => openEditModal(item)}
                    title="Edit"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>

                  <button
                    className="action-btn remove"
                    onClick={() => removeItem(item.id)}
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

      {/* Category Stats Summary */}
      {currentList.length > 0 && (
        <div className="category-summary">
          {CATEGORIES.map(cat => {
            const items = currentList.filter(i => i.category === cat.key)
            if (items.length === 0) return null
            const value = items.reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 1)), 0)
            return (
              <div key={cat.key} className="category-stat">
                <div className="category-stat-icon">{cat.icon}</div>
                <div className="category-stat-count">{items.length}</div>
                <div className="category-stat-label">{cat.label}</div>
                {activeTab === 'inventory' && value > 0 && (
                  <div className="category-stat-value">{formatCurrency(value)}</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal material-modal">
            <header className="modal-header">
              <h2 className="modal-title">
                {editingItem ? 'Edit Item' : `Add to ${activeTab === 'inventory' ? 'Inventory' : 'Wishlist'}`}
              </h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <form onSubmit={handleSaveItem}>
              <div className="form-row">
                <div className="form-group flex-2">
                  <label className="form-label">Item Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Cadmium Yellow Medium"
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.key} value={cat.key}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <select
                    className="form-select"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  >
                    <option value="">Select brand...</option>
                    {PAINT_BRANDS.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Color Code</label>
                  <div className="color-input-wrapper">
                    <input
                      type="text"
                      className="form-input"
                      value={formData.colorCode}
                      onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                      placeholder="e.g., PY37 or #FFD700"
                    />
                    <input
                      type="color"
                      className="color-picker"
                      value={formData.colorCode.startsWith('#') ? formData.colorCode : '#ffffff'}
                      onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Size</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g., 37ml, 16oz"
                  />
                </div>
              </div>

              {activeTab === 'inventory' && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Low Stock Alert At</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                      min="0"
                    />
                  </div>
                </div>
              )}

              <div className="form-section-title">Expense Tracking</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cost per Unit ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Purchase Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Purchase Link</label>
                <input
                  type="url"
                  className="form-input"
                  value={formData.purchaseLink}
                  onChange={(e) => setFormData({ ...formData, purchaseLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows="2"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="action-btn" onClick={() => setShowAddModal(false)} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="action-btn primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : (editingItem ? 'Save Changes' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Materials

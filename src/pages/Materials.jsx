import { useState, useEffect } from 'react'

function Materials() {
  const [inventory, setInventory] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [newItem, setNewItem] = useState('')
  const [activeTab, setActiveTab] = useState('inventory')

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
      addedAt: new Date().toLocaleDateString()
    }

    if (activeTab === 'inventory') {
      setInventory([...inventory, item])
    } else {
      setWishlist([...wishlist, item])
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
    setInventory([...inventory, { ...item, id: Date.now(), addedAt: new Date().toLocaleDateString() }])
  }

  const currentList = activeTab === 'inventory' ? inventory : wishlist

  return (
    <div className="materials">
      <h1>Art Materials</h1>
      <p className="materials-subtitle">Track your supplies and wishlist</p>

      <div className="materials-tabs">
        <button
          className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          My Inventory ({inventory.length})
        </button>
        <button
          className={`tab ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('wishlist')}
        >
          Wishlist ({wishlist.length})
        </button>
      </div>

      <form className="materials-form" onSubmit={addItem}>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={activeTab === 'inventory' ? 'Add material you have...' : 'Add material you want...'}
        />
        <button type="submit">Add</button>
      </form>

      <div className="materials-list">
        {currentList.length === 0 ? (
          <p className="empty-message">
            {activeTab === 'inventory'
              ? 'No materials in your inventory yet. Start adding what you have!'
              : 'Your wishlist is empty. Add materials you want to get!'}
          </p>
        ) : (
          currentList.map(item => (
            <div key={item.id} className="material-item">
              <div className="material-info">
                <span className="material-name">{item.name}</span>
                <span className="material-date">Added {item.addedAt}</span>
              </div>
              <div className="material-actions">
                {activeTab === 'wishlist' && (
                  <button
                    className="action-btn got-it"
                    onClick={() => moveToInventory(item)}
                    title="Got it! Move to inventory"
                  >
                    Got it
                  </button>
                )}
                <button
                  className="action-btn remove"
                  onClick={() => removeItem(item.id, activeTab)}
                  title="Remove"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Materials

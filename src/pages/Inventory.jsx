import { useState, useEffect } from 'react'
import ArtCard from '../components/ArtCard'
import { loadArtworks, saveArtworks } from '../data/artworks'

function Inventory() {
  const [artworks, setArtworks] = useState([])
  const [filter, setFilter] = useState('active') // 'active', 'archived', 'all'

  useEffect(() => {
    setArtworks(loadArtworks())
  }, [])

  const handleArchive = (id) => {
    const updated = artworks.map((art) =>
      art.id === id ? { ...art, archived: !art.archived } : art
    )
    setArtworks(updated)
    saveArtworks(updated)
  }

  const filteredArtworks = artworks.filter((art) => {
    if (filter === 'active') return !art.archived
    if (filter === 'archived') return art.archived
    return true
  })

  const activeCount = artworks.filter((a) => !a.archived).length
  const archivedCount = artworks.filter((a) => a.archived).length

  return (
    <div className="inventory">
      <header className="inventory__header">
        <h1>Art Inventory</h1>
        <p className="inventory__subtitle">
          Track and manage your completed artworks
        </p>
      </header>

      <div className="inventory__filters">
        <button
          className={`inventory__filter-btn ${filter === 'active' ? 'inventory__filter-btn--active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({activeCount})
        </button>
        <button
          className={`inventory__filter-btn ${filter === 'archived' ? 'inventory__filter-btn--active' : ''}`}
          onClick={() => setFilter('archived')}
        >
          Archived ({archivedCount})
        </button>
        <button
          className={`inventory__filter-btn ${filter === 'all' ? 'inventory__filter-btn--active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({artworks.length})
        </button>
      </div>

      {filteredArtworks.length === 0 ? (
        <div className="inventory__empty">
          <p>No artworks found in this category.</p>
        </div>
      ) : (
        <div className="inventory__grid">
          {filteredArtworks.map((artwork) => (
            <ArtCard
              key={artwork.id}
              artwork={artwork}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Inventory

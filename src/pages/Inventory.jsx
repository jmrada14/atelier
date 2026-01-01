import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from '../context/AuthContext'
import ArtCard from '../components/ArtCard'

function AddArtworkModal({ onSave, onClose, isSaving }) {
  const [formData, setFormData] = useState({
    title: '',
    medium: '',
    yearCompleted: new Date().getFullYear(),
    price: 0,
    location: 'Studio',
    imageFile: null,
    imagePreview: '',
  })
  const fileInputRef = useRef(null)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: previewUrl,
      }))
    }
  }

  const handleRemoveImage = () => {
    if (formData.imagePreview) {
      URL.revokeObjectURL(formData.imagePreview)
    }
    setFormData(prev => ({ ...prev, imageFile: null, imagePreview: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      title: formData.title,
      medium: formData.medium,
      yearCompleted: formData.yearCompleted,
      price: formData.price,
      location: formData.location,
      imageFile: formData.imageFile,
    })
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <header className="modal-header">
          <h2 className="modal-title">Add New Artwork</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Artwork Image</label>
            <div className="image-upload">
              {formData.imagePreview ? (
                <div className="image-upload__preview">
                  <div className="image-upload__preview-item">
                    <img src={formData.imagePreview} alt="Preview" />
                    <button
                      type="button"
                      className="image-upload__remove"
                      onClick={handleRemoveImage}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="image-upload__dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <p className="image-upload__text">
                    <strong>Click to upload</strong> or drag and drop
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Artwork title"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="medium">Medium</label>
            <input
              type="text"
              id="medium"
              className="form-input"
              value={formData.medium}
              onChange={(e) => setFormData(prev => ({ ...prev, medium: e.target.value }))}
              placeholder="e.g., Oil on canvas, Watercolor, Mixed media"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="yearCompleted">Year Completed</label>
              <input
                type="number"
                id="yearCompleted"
                className="form-input"
                value={formData.yearCompleted}
                onChange={(e) => setFormData(prev => ({ ...prev, yearCompleted: parseInt(e.target.value) }))}
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="price">Price ($)</label>
              <input
                type="number"
                id="price"
                className="form-input"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              className="form-input"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Studio, Gallery Downtown, Storage"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="action-btn" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="action-btn primary" disabled={isSaving}>
              {isSaving ? 'Adding...' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Inventory() {
  const { sessionToken } = useAuth()
  const [filter, setFilter] = useState('active')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Convex queries and mutations
  const artworks = useQuery(
    api.artworks.list,
    sessionToken ? { sessionToken } : "skip"
  ) || []

  const createArtwork = useMutation(api.artworks.create)
  const updateArtwork = useMutation(api.artworks.update)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)

  const handleArchive = async (id) => {
    const artwork = artworks.find(a => a.id === id)
    if (!artwork) return

    try {
      await updateArtwork({
        sessionToken,
        id,
        archived: !artwork.archived,
      })
    } catch (error) {
      console.error('Failed to archive artwork:', error)
    }
  }

  const handleAddArtwork = async (artworkData) => {
    setIsSaving(true)
    try {
      let storageId = undefined

      // Upload image if provided
      if (artworkData.imageFile) {
        const uploadUrl = await generateUploadUrl({ sessionToken })
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': artworkData.imageFile.type },
          body: artworkData.imageFile,
        })

        if (!result.ok) {
          throw new Error('Failed to upload image')
        }

        const json = await result.json()
        storageId = json.storageId
      }

      await createArtwork({
        sessionToken,
        title: artworkData.title,
        medium: artworkData.medium,
        yearCompleted: artworkData.yearCompleted,
        price: artworkData.price,
        location: artworkData.location,
        storageId,
      })
      setShowAddModal(false)
    } catch (error) {
      console.error('Failed to add artwork:', error)
    } finally {
      setIsSaving(false)
    }
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
        <div className="inventory__header-left">
          <h1>Art Inventory</h1>
          <p className="inventory__subtitle">
            Track and manage your completed artworks
          </p>
        </div>
        <button className="inventory__add-btn" onClick={() => setShowAddModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Artwork
        </button>
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
          {artworks.length === 0 ? (
            <>
              <p>Your inventory is empty.</p>
              <p style={{ marginTop: 'var(--space-sm)' }}>
                Add your first artwork or complete a work in progress to get started.
              </p>
            </>
          ) : (
            <p>No artworks found in this category.</p>
          )}
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

      {showAddModal && (
        <AddArtworkModal
          onSave={handleAddArtwork}
          onClose={() => setShowAddModal(false)}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}

export default Inventory

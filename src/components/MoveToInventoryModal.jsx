import { useState, useEffect } from 'react'

function MoveToInventoryModal({ piece, onConfirm, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    medium: '',
    yearCompleted: new Date().getFullYear(),
    price: 0,
    location: 'Studio',
    thumbnailUrl: '',
  })

  useEffect(() => {
    if (piece) {
      const lastImage = piece.images && piece.images.length > 0
        ? piece.images[piece.images.length - 1].url
        : ''

      setFormData({
        title: piece.title || '',
        medium: '',
        yearCompleted: new Date().getFullYear(),
        price: 0,
        location: 'Studio',
        thumbnailUrl: lastImage,
      })
    }
  }, [piece])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm(formData)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <header className="modal-header">
          <h2 className="modal-title">Move to Inventory</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <p style={{ color: 'var(--graphite)', marginBottom: 'var(--space-lg)', fontSize: '0.9375rem' }}>
          Complete the details to add this finished piece to your art inventory.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
              <label className="form-label" htmlFor="yearCompleted">Year</label>
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

          {formData.thumbnailUrl && (
            <div className="form-group">
              <label className="form-label">Preview Image</label>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--linen)'
              }}>
                <img
                  src={formData.thumbnailUrl}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--graphite)', marginTop: 'var(--space-xs)' }}>
                Using the latest progress photo as the artwork image
              </p>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="action-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="action-btn primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Add to Inventory
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MoveToInventoryModal

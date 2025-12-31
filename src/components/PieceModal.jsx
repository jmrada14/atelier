import { useState, useEffect } from 'react'

const PIECE_TYPES = [
  { value: 'commission', label: 'Commission' },
  { value: 'gallery', label: 'Gallery Piece' },
  { value: 'exploration', label: 'Exploration' },
]

const STATUS_OPTIONS = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

function PieceModal({ piece, onSave, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    deadline: '',
    status: 'not-started',
    type: 'exploration',
    notes: [],
  })
  const [noteInputs, setNoteInputs] = useState([''])

  useEffect(() => {
    if (piece) {
      setFormData({
        title: piece.title || '',
        deadline: piece.deadline || '',
        status: piece.status || 'not-started',
        type: piece.type || 'exploration',
        notes: piece.notes || [],
      })
      setNoteInputs(piece.notes?.length > 0 ? piece.notes.map(n => n.text) : [''])
    }
  }, [piece])

  const handleSubmit = (e) => {
    e.preventDefault()
    const notes = noteInputs
      .filter(text => text.trim())
      .map((text, i) => {
        const existingNote = formData.notes[i]
        return existingNote
          ? { ...existingNote, text }
          : { id: `note-${Date.now()}-${i}`, text, createdAt: new Date().toISOString() }
      })

    onSave({
      ...formData,
      notes,
    })
  }

  const handleAddNoteInput = () => {
    setNoteInputs(prev => [...prev, ''])
  }

  const handleNoteChange = (index, value) => {
    setNoteInputs(prev => prev.map((note, i) => i === index ? value : note))
  }

  const handleRemoveNote = (index) => {
    setNoteInputs(prev => prev.filter((_, i) => i !== index))
  }

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <header className="modal-header">
          <h2 className="modal-title">{piece ? 'Edit Piece' : 'New Piece'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Name of your piece"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="deadline">Deadline</label>
            <input
              type="date"
              id="deadline"
              className="form-input"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Type</label>
            <div className="tag-options">
              {PIECE_TYPES.map(type => (
                <label
                  key={type.value}
                  className={`tag-option ${formData.type === type.value ? 'selected' : ''}`}
                  data-tag={type.value}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  />
                  <span className="tag-dot"></span>
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="status">Status</label>
            <select
              id="status"
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <div className="notes-list">
              {noteInputs.map((note, index) => (
                <div key={index} className="note-input-row">
                  <input
                    type="text"
                    className="form-input"
                    value={note}
                    onChange={(e) => handleNoteChange(index, e.target.value)}
                    placeholder="Add a note..."
                  />
                  {noteInputs.length > 1 && (
                    <button
                      type="button"
                      className="note-remove-btn"
                      onClick={() => handleRemoveNote(index)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="add-note-btn" onClick={handleAddNoteInput}>
              + Add Another Note
            </button>
          </div>

          <div className="form-actions">
            <button type="button" className="action-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="action-btn primary">
              {piece ? 'Save Changes' : 'Create Piece'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PieceModal

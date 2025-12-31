import { useState } from 'react'

const STATUS_OPTIONS = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

const TYPE_LABELS = {
  commission: 'Commission',
  gallery: 'Gallery',
  exploration: 'Exploration',
}

function formatDeadline(dateString) {
  if (!dateString) return null

  const deadline = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  deadline.setHours(0, 0, 0, 0)

  const diffTime = deadline - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  const formatted = deadline.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: deadline.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  })

  let urgency = ''
  if (diffDays < 0) {
    urgency = 'urgent'
  } else if (diffDays <= 7) {
    urgency = 'soon'
  }

  let label = formatted
  if (diffDays === 0) label = 'Today'
  else if (diffDays === 1) label = 'Tomorrow'
  else if (diffDays === -1) label = 'Yesterday'
  else if (diffDays < -1) label = `${Math.abs(diffDays)} days overdue`
  else if (diffDays <= 7) label = `${diffDays} days left`

  return { formatted, label, urgency, diffDays }
}

function PieceCard({ piece, onEdit, onDelete, onStatusChange, onAddNote, onDeleteNote }) {
  const [newNote, setNewNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)

  const deadlineInfo = formatDeadline(piece.deadline)

  const handleAddNote = (e) => {
    e.preventDefault()
    if (newNote.trim()) {
      onAddNote(newNote.trim())
      setNewNote('')
      setShowNoteInput(false)
    }
  }

  return (
    <article className="piece-card" data-status={piece.status}>
      <header className="piece-header">
        <h3 className="piece-title">{piece.title}</h3>
        <span className={`piece-tag ${piece.type}`}>
          {TYPE_LABELS[piece.type]}
        </span>
      </header>

      <div className="piece-meta">
        {deadlineInfo && (
          <div className={`piece-deadline ${deadlineInfo.urgency}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span title={deadlineInfo.formatted}>{deadlineInfo.label}</span>
          </div>
        )}
        <div className="piece-status" data-status={piece.status}>
          <span className="status-dot"></span>
          <select
            value={piece.status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="status-select"
            style={{
              background: 'transparent',
              border: 'none',
              font: 'inherit',
              color: 'inherit',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {(piece.notes?.length > 0 || showNoteInput) && (
        <div className="piece-notes">
          <div className="notes-header">Notes</div>
          {piece.notes?.map(note => (
            <div key={note.id} className="note-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ flex: 1 }}>{note.text}</span>
              <button
                onClick={() => onDeleteNote(note.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 0 0 8px',
                  color: 'var(--graphite)',
                  opacity: 0.5,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => e.target.style.opacity = 1}
                onMouseLeave={(e) => e.target.style.opacity = 0.5}
                title="Delete note"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
          {showNoteInput && (
            <form onSubmit={handleAddNote} style={{ marginTop: 'var(--space-sm)' }}>
              <div className="note-input-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="action-btn primary" style={{ padding: '0 var(--space-md)' }}>
                  Add
                </button>
                <button
                  type="button"
                  className="note-remove-btn"
                  onClick={() => {
                    setShowNoteInput(false)
                    setNewNote('')
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="piece-actions">
        {!showNoteInput && (
          <button className="action-btn" onClick={() => setShowNoteInput(true)}>
            + Note
          </button>
        )}
        <button className="action-btn" onClick={onEdit}>
          Edit
        </button>
        <button
          className="action-btn"
          onClick={onDelete}
          style={{ marginLeft: 'auto' }}
        >
          Delete
        </button>
      </div>
    </article>
  )
}

export default PieceCard

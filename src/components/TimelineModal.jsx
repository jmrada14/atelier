import { useState, useEffect } from 'react'

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function TimelineModal({ piece, onClose }) {
  const [leftIndex, setLeftIndex] = useState(0)
  const [rightIndex, setRightIndex] = useState(1)

  const images = piece.images || []

  useEffect(() => {
    if (images.length >= 2) {
      setLeftIndex(0)
      setRightIndex(images.length - 1)
    }
  }, [images.length])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (images.length < 2) {
    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal modal-wide">
          <header className="modal-header">
            <h2 className="modal-title">Progress Timeline</h2>
            <button className="modal-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>
          <p style={{ textAlign: 'center', color: 'var(--graphite)', padding: 'var(--space-xl)' }}>
            Add at least 2 progress photos to use the timeline comparison.
          </p>
        </div>
      </div>
    )
  }

  const leftImage = images[leftIndex]
  const rightImage = images[rightIndex]

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-full">
        <div className="timeframe-view">
          <header className="timeframe-header">
            <h2 className="timeframe-title">{piece.title} — Progress Timeline</h2>
            <button className="modal-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>

          <div className="timeframe-grid">
            <div className="timeframe-panel">
              <div className="timeframe-panel__header">
                <span className="timeframe-panel__title">Earlier</span>
                <span className="timeframe-panel__date">{formatDate(leftImage.createdAt)}</span>
              </div>
              <div className="timeframe-panel__image">
                <img src={leftImage.url} alt="Earlier progress" />
                <a
                  href={leftImage.url}
                  download={`${piece.title}-earlier-${formatDate(leftImage.createdAt)}.jpg`}
                  className="timeframe-download-btn"
                  title="Download image"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="timeframe-panel">
              <div className="timeframe-panel__header">
                <span className="timeframe-panel__title">Later</span>
                <span className="timeframe-panel__date">{formatDate(rightImage.createdAt)}</span>
              </div>
              <div className="timeframe-panel__image">
                <img src={rightImage.url} alt="Later progress" />
                <a
                  href={rightImage.url}
                  download={`${piece.title}-later-${formatDate(rightImage.createdAt)}.jpg`}
                  className="timeframe-download-btn"
                  title="Download image"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="timeframe-timeline">
            {images.map((img, index) => (
              <div
                key={img.id}
                className={`timeframe-thumb ${index === leftIndex || index === rightIndex ? 'active' : ''}`}
                onClick={() => {
                  if (index < rightIndex) {
                    setLeftIndex(index)
                  } else if (index > leftIndex) {
                    setRightIndex(index)
                  } else {
                    // Clicked on already selected - toggle sides
                    if (index === leftIndex && images.length > 2) {
                      setLeftIndex(Math.max(0, index - 1))
                    } else if (index === rightIndex && images.length > 2) {
                      setRightIndex(Math.min(images.length - 1, index + 1))
                    }
                  }
                }}
                style={{
                  borderColor: index === leftIndex ? 'var(--prussian-blue)' :
                               index === rightIndex ? 'var(--viridian)' : 'transparent'
                }}
              >
                <img src={img.url} alt={`Progress ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimelineModal

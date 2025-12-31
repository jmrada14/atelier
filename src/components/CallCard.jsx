import { useState } from 'react'

const TYPE_LABELS = {
  exhibition: 'Exhibition',
  residency: 'Residency',
  grant: 'Grant',
  fellowship: 'Fellowship',
  commission: 'Commission',
}

const TYPE_ICONS = {
  exhibition: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  residency: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  grant: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M6 12h12" />
    </svg>
  ),
  fellowship: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  commission: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
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
    urgency = 'closed'
  } else if (diffDays <= 7) {
    urgency = 'urgent'
  } else if (diffDays <= 14) {
    urgency = 'soon'
  }

  let label = formatted
  if (diffDays === 0) label = 'Closes Today!'
  else if (diffDays === 1) label = 'Closes Tomorrow'
  else if (diffDays < 0) label = 'Closed'
  else if (diffDays <= 14) label = `${diffDays} days left`

  return { formatted, label, urgency, diffDays, isClosed: diffDays < 0 }
}

function CallCard({ call, onBookmark, onApply, onHide, onViewDetails }) {
  const [expanded, setExpanded] = useState(false)
  const deadlineInfo = formatDeadline(call.deadline)

  const getRecommendationBadge = () => {
    if (call.recommendation === 'highly-recommended') {
      return (
        <span className="call-badge recommended">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          Highly Recommended
        </span>
      )
    }
    if (call.recommendation === 'recommended') {
      return <span className="call-badge good-match">Good Match</span>
    }
    return null
  }

  return (
    <article className={`call-card ${deadlineInfo?.isClosed ? 'closed' : ''} ${call.applied ? 'applied' : ''}`}>
      <header className="call-header">
        <div className="call-header-top">
          <span className={`call-type ${call.type}`}>
            {TYPE_ICONS[call.type]}
            {TYPE_LABELS[call.type] || call.type}
          </span>
          {call.featured && <span className="call-featured">Featured</span>}
          {getRecommendationBadge()}
        </div>
        <h3 className="call-title">{call.title}</h3>
        <p className="call-org">{call.organization}</p>
      </header>

      <div className="call-meta">
        <div className="call-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{call.location}</span>
        </div>
        {deadlineInfo && (
          <div className={`call-meta-item deadline ${deadlineInfo.urgency}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span title={deadlineInfo.formatted}>{deadlineInfo.label}</span>
          </div>
        )}
        <div className="call-meta-item fee">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
          <span>{call.entryFee === 0 ? 'Free' : `$${call.entryFee} fee`}</span>
        </div>
      </div>

      {call.score !== undefined && (
        <div className="call-score">
          <div className="score-bar">
            <div className="score-fill" style={{ width: `${call.score}%` }}></div>
          </div>
          <span className="score-label">{call.score}% match</span>
        </div>
      )}

      {call.reasons?.length > 0 && (
        <div className="call-reasons">
          {call.reasons.slice(0, 2).map((reason, i) => (
            <span key={i} className="reason-tag">{reason}</span>
          ))}
          {call.reasons.length > 2 && (
            <span className="reason-more">+{call.reasons.length - 2} more</span>
          )}
        </div>
      )}

      <div className="call-mediums">
        {call.mediums?.slice(0, 3).map((medium, i) => (
          <span key={i} className="medium-tag">{medium}</span>
        ))}
        {call.mediums?.length > 3 && (
          <span className="medium-tag more">+{call.mediums.length - 3}</span>
        )}
      </div>

      {expanded && (
        <div className="call-details">
          <p className="call-description">{call.description}</p>
          {call.theme && (
            <div className="call-detail-row">
              <strong>Theme:</strong> {call.theme}
            </div>
          )}
          {call.eligibility && (
            <div className="call-detail-row">
              <strong>Eligibility:</strong> {call.eligibility}
            </div>
          )}
          {call.prizes && (
            <div className="call-detail-row">
              <strong>Prizes:</strong> {call.prizes}
            </div>
          )}
        </div>
      )}

      {call.applied && (
        <div className="call-applied-status">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>Applied{call.applicationStatus ? ` - ${call.applicationStatus}` : ''}</span>
        </div>
      )}

      <div className="call-actions">
        <button
          className={`action-btn ${call.bookmarked ? 'bookmarked' : ''}`}
          onClick={() => onBookmark(call.id)}
          title={call.bookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={call.bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        </button>
        <button
          className="action-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Less' : 'More'}
        </button>
        {call.url && !deadlineInfo?.isClosed && (
          <a
            href={call.url}
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn primary"
            onClick={() => onApply?.(call.id)}
          >
            Apply
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
        <button
          className="action-btn hide"
          onClick={() => onHide(call.id)}
          title="Hide this call"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        </button>
      </div>
    </article>
  )
}

export default CallCard

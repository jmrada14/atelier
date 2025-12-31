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

const APPLICATION_STATUSES = [
  { value: 'preparing', label: 'Preparing', color: '#6b7280' },
  { value: 'submitted', label: 'Submitted', color: '#3b82f6' },
  { value: 'under-review', label: 'Under Review', color: '#f59e0b' },
  { value: 'accepted', label: 'Accepted', color: '#10b981' },
  { value: 'rejected', label: 'Rejected', color: '#ef4444' },
  { value: 'waitlisted', label: 'Waitlisted', color: '#8b5cf6' },
]

const DEFAULT_CHECKLIST = [
  { id: 'images', label: 'Artwork images prepared', checked: false },
  { id: 'statement', label: 'Artist statement updated', checked: false },
  { id: 'cv', label: 'CV/Resume ready', checked: false },
  { id: 'bio', label: 'Artist bio written', checked: false },
  { id: 'description', label: 'Work descriptions complete', checked: false },
  { id: 'fee', label: 'Entry fee paid', checked: false },
]

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

function CallCard({
  call,
  onBookmark,
  onApply,
  onHide,
  onUpdateStatus,
  onUpdateChecklist,
  onAddToGoogleCalendar,
  onDownloadICS
}) {
  const [expanded, setExpanded] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showCalendarMenu, setShowCalendarMenu] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)

  const deadlineInfo = formatDeadline(call.deadline)
  const checklist = call.checklist?.length > 0 ? call.checklist : DEFAULT_CHECKLIST
  const checklistProgress = checklist.filter(item => item.checked).length
  const statusInfo = APPLICATION_STATUSES.find(s => s.value === call.applicationStatus)

  const handleChecklistToggle = (itemId) => {
    const updatedChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    )
    onUpdateChecklist?.(call.id, updatedChecklist)
  }

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
        <div className="call-org-row">
          <p className="call-org">{call.organization}</p>
          {call.source && (
            <span className="call-source">via {call.source}</span>
          )}
        </div>
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
          <span>{call.entryFee === 0 ? 'Free' : call.entryFee ? `$${call.entryFee} fee` : 'Fee varies'}</span>
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

      {/* Application Status Section */}
      {call.applied && (
        <div className="call-application-status">
          <div className="status-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Application Status</span>
          </div>
          <div className="status-controls">
            <div className="status-dropdown">
              <button
                className="status-current"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                style={{ '--status-color': statusInfo?.color || '#6b7280' }}
              >
                <span className="status-dot" style={{ background: statusInfo?.color || '#6b7280' }}></span>
                {statusInfo?.label || 'Set Status'}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {showStatusMenu && (
                <div className="status-menu">
                  {APPLICATION_STATUSES.map(status => (
                    <button
                      key={status.value}
                      className={`status-option ${call.applicationStatus === status.value ? 'active' : ''}`}
                      onClick={() => {
                        onUpdateStatus?.(call.id, status.value)
                        setShowStatusMenu(false)
                      }}
                    >
                      <span className="status-dot" style={{ background: status.color }}></span>
                      {status.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className={`checklist-toggle ${showChecklist ? 'active' : ''}`}
              onClick={() => setShowChecklist(!showChecklist)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              {checklistProgress}/{checklist.length}
            </button>
          </div>

          {/* Submission Checklist */}
          {showChecklist && (
            <div className="submission-checklist">
              <div className="checklist-header">
                <span>Submission Checklist</span>
                <span className="checklist-progress">
                  {Math.round((checklistProgress / checklist.length) * 100)}% complete
                </span>
              </div>
              <div className="checklist-items">
                {checklist.map(item => (
                  <label key={item.id} className={`checklist-item ${item.checked ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleChecklistToggle(item.id)}
                    />
                    <span className="checkmark">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="checklist-label">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {call.submissionDate && (
            <div className="submission-date">
              Submitted {new Date(call.submissionDate).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              })}
            </div>
          )}
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

        {/* Calendar Sync */}
        {!deadlineInfo?.isClosed && call.deadline && (
          <div className="calendar-dropdown">
            <button
              className="action-btn calendar"
              onClick={() => setShowCalendarMenu(!showCalendarMenu)}
              title="Add to calendar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>
            {showCalendarMenu && (
              <div className="calendar-menu">
                <a
                  href={onAddToGoogleCalendar?.(call)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="calendar-option"
                  onClick={() => setShowCalendarMenu(false)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.5 4.5h-2.25V3a.75.75 0 00-1.5 0v1.5h-7.5V3a.75.75 0 00-1.5 0v1.5H4.5A1.5 1.5 0 003 6v13.5A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5zM4.5 6h15v2.25H4.5V6zm0 13.5V9.75h15v9.75H4.5z"/>
                  </svg>
                  Google Calendar
                </a>
                <button
                  className="calendar-option"
                  onClick={() => {
                    onDownloadICS?.(call)
                    setShowCalendarMenu(false)
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download .ics (Apple/Outlook)
                </button>
              </div>
            )}
          </div>
        )}

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
            onClick={() => !call.applied && onApply?.(call.id)}
          >
            {call.applied ? 'View' : 'Apply'}
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

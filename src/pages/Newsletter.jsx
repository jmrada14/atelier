import { useState } from 'react'
import { useCollectors } from '../context/CollectorContext'
import { formatDate } from '../utils/dateUtils'

const TEMPLATES = {
  studioUpdate: {
    name: 'Studio Update',
    subject: 'News from the Studio',
    body: `Dear Friends,

I hope this message finds you well. I wanted to share some exciting updates from the studio.

[NEW WORK]
I've been working on a new series that explores...

[EXHIBITIONS & EVENTS]
Coming up, you can see my work at...

[STUDIO VISITS]
If you're in the area, I'd love to welcome you for a studio visit. Please reach out to schedule a time.

Thank you for your continued support and interest in my work.

Warm regards,
[Your Name]`
  },
  exhibitionAnnouncement: {
    name: 'Exhibition Announcement',
    subject: 'You\'re Invited: New Exhibition',
    body: `Dear Collectors and Friends,

I'm thrilled to invite you to my upcoming exhibition:

[EXHIBITION TITLE]
[GALLERY NAME]
[ADDRESS]
[DATES]
[OPENING RECEPTION: DATE & TIME]

This body of work represents...

I hope to see you there.

Best wishes,
[Your Name]`
  },
  seasonalGreeting: {
    name: 'Seasonal Greeting',
    subject: 'Warm Wishes from the Studio',
    body: `Dear Friends,

As another year comes to a close, I wanted to take a moment to thank you for your support of my work.

Looking back on this year, I'm grateful for...

In the coming year, I'm excited to...

Wishing you all the best for the season ahead.

With gratitude,
[Your Name]`
  },
  newWorkAvailable: {
    name: 'New Work Available',
    subject: 'New Artwork Available',
    body: `Dear Collectors,

I'm pleased to share that new work is now available from the studio.

[DESCRIBE THE NEW PIECES]

[PRICING/AVAILABILITY INFORMATION]

Please don't hesitate to reach out if you'd like more information or to arrange a viewing.

Best,
[Your Name]`
  }
}

function Newsletter() {
  const { collectors, newsletters, saveNewsletter, deleteNewsletter } = useCollectors()

  const [currentDraft, setCurrentDraft] = useState({
    id: null,
    subject: '',
    body: '',
    selectedRecipients: []
  })
  const [showRecipients, setShowRecipients] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSavedDrafts, setShowSavedDrafts] = useState(false)
  const [copySuccess, setCopySuccess] = useState('')

  const applyTemplate = (templateKey) => {
    const template = TEMPLATES[templateKey]
    setCurrentDraft({
      ...currentDraft,
      subject: template.subject,
      body: template.body
    })
    setShowTemplates(false)
  }

  const saveDraft = () => {
    if (!currentDraft.subject && !currentDraft.body) return

    saveNewsletter({
      id: currentDraft.id,
      subject: currentDraft.subject,
      body: currentDraft.body,
      selectedRecipients: currentDraft.selectedRecipients,
      status: 'draft'
    })

    setCopySuccess('Draft saved!')
    setTimeout(() => setCopySuccess(''), 2000)
  }

  const loadDraft = (newsletter) => {
    setCurrentDraft({
      id: newsletter.id,
      subject: newsletter.subject,
      body: newsletter.body,
      selectedRecipients: newsletter.selectedRecipients || []
    })
    setShowSavedDrafts(false)
  }

  const newDraft = () => {
    setCurrentDraft({
      id: null,
      subject: '',
      body: '',
      selectedRecipients: []
    })
  }

  const toggleRecipient = (id) => {
    setCurrentDraft(prev => ({
      ...prev,
      selectedRecipients: prev.selectedRecipients.includes(id)
        ? prev.selectedRecipients.filter(r => r !== id)
        : [...prev.selectedRecipients, id]
    }))
  }

  const selectAllRecipients = () => {
    setCurrentDraft(prev => ({
      ...prev,
      selectedRecipients: collectors.map(c => c.id)
    }))
  }

  const selectByCategory = (category) => {
    const categoryCollectors = collectors.filter(c => c.category === category)
    setCurrentDraft(prev => ({
      ...prev,
      selectedRecipients: [...new Set([...prev.selectedRecipients, ...categoryCollectors.map(c => c.id)])]
    }))
  }

  const getRecipientEmails = () => {
    return collectors
      .filter(c => currentDraft.selectedRecipients.includes(c.id))
      .map(c => c.email)
  }

  const copyEmailList = () => {
    const emails = getRecipientEmails().join(', ')
    navigator.clipboard.writeText(emails)
    setCopySuccess('Emails copied!')
    setTimeout(() => setCopySuccess(''), 2000)
  }

  const copyNewsletter = () => {
    const content = `Subject: ${currentDraft.subject}\n\n${currentDraft.body}`
    navigator.clipboard.writeText(content)
    setCopySuccess('Newsletter copied!')
    setTimeout(() => setCopySuccess(''), 2000)
  }

  const openInEmail = () => {
    const emails = getRecipientEmails().join(',')
    const subject = encodeURIComponent(currentDraft.subject)
    const body = encodeURIComponent(currentDraft.body)
    window.open(`mailto:${emails}?subject=${subject}&body=${body}`)
  }

  const selectedCollectors = collectors.filter(c =>
    currentDraft.selectedRecipients.includes(c.id)
  )

  return (
    <div className="newsletter-page">
      <div className="page-header">
        <h1>Studio Newsletter</h1>
        <p>Draft and send updates to your art contacts</p>
      </div>

      <div className="newsletter-toolbar">
        <div className="toolbar-left">
          <button onClick={() => setShowTemplates(!showTemplates)} className="template-btn">
            Templates
          </button>
          <button onClick={() => setShowSavedDrafts(!showSavedDrafts)} className="drafts-btn">
            Saved Drafts ({newsletters.length})
          </button>
          <button onClick={newDraft} className="new-btn">
            New Draft
          </button>
        </div>
        <div className="toolbar-right">
          {copySuccess && <span className="copy-success">{copySuccess}</span>}
          <button onClick={saveDraft} className="save-btn">
            Save Draft
          </button>
        </div>
      </div>

      {showTemplates && (
        <div className="templates-panel">
          <h3>Choose a Template</h3>
          <div className="templates-grid">
            {Object.entries(TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => applyTemplate(key)}
                className="template-card"
              >
                <strong>{template.name}</strong>
                <span>{template.subject}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showSavedDrafts && newsletters.length > 0 && (
        <div className="drafts-panel">
          <h3>Saved Drafts</h3>
          <div className="drafts-list">
            {newsletters.map(n => (
              <div key={n.id} className="draft-item">
                <div className="draft-info">
                  <strong>{n.subject || '(No subject)'}</strong>
                  <span>Last updated: {formatDate(n.updatedAt)}</span>
                </div>
                <div className="draft-actions">
                  <button onClick={() => loadDraft(n)}>Load</button>
                  <button onClick={() => deleteNewsletter(n.id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="newsletter-editor">
        <div className="editor-main">
          <div className="form-group">
            <label>Subject Line</label>
            <input
              type="text"
              value={currentDraft.subject}
              onChange={(e) => setCurrentDraft({ ...currentDraft, subject: e.target.value })}
              placeholder="Enter your newsletter subject..."
            />
          </div>
          <div className="form-group">
            <label>Newsletter Content</label>
            <textarea
              value={currentDraft.body}
              onChange={(e) => setCurrentDraft({ ...currentDraft, body: e.target.value })}
              placeholder="Write your newsletter here..."
              rows={20}
            />
          </div>
        </div>

        <div className="editor-sidebar">
          <div className="recipients-section">
            <div className="recipients-header">
              <h3>Recipients ({selectedCollectors.length})</h3>
              <button
                onClick={() => setShowRecipients(!showRecipients)}
                className="toggle-btn"
              >
                {showRecipients ? 'Hide' : 'Select'}
              </button>
            </div>

            {showRecipients && (
              <div className="recipients-selector">
                <div className="quick-select">
                  <button onClick={selectAllRecipients}>Select All</button>
                  <button onClick={() => selectByCategory('collector')}>Collectors</button>
                  <button onClick={() => selectByCategory('gallery')}>Galleries</button>
                  <button onClick={() => selectByCategory('press')}>Press</button>
                </div>
                <div className="recipient-list">
                  {collectors.map(c => (
                    <label key={c.id} className="recipient-item">
                      <input
                        type="checkbox"
                        checked={currentDraft.selectedRecipients.includes(c.id)}
                        onChange={() => toggleRecipient(c.id)}
                      />
                      <span className="recipient-name">{c.name}</span>
                      <span className="recipient-category">{c.category}</span>
                    </label>
                  ))}
                  {collectors.length === 0 && (
                    <p className="no-contacts">Add contacts first</p>
                  )}
                </div>
              </div>
            )}

            {selectedCollectors.length > 0 && (
              <div className="selected-preview">
                <p>Sending to:</p>
                <ul>
                  {selectedCollectors.slice(0, 5).map(c => (
                    <li key={c.id}>{c.name}</li>
                  ))}
                  {selectedCollectors.length > 5 && (
                    <li className="more">+{selectedCollectors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="send-actions">
            <button
              onClick={copyEmailList}
              disabled={selectedCollectors.length === 0}
              className="action-btn"
            >
              Copy Email List
            </button>
            <button
              onClick={copyNewsletter}
              disabled={!currentDraft.body}
              className="action-btn"
            >
              Copy Newsletter
            </button>
            <button
              onClick={openInEmail}
              disabled={selectedCollectors.length === 0 || !currentDraft.subject}
              className="action-btn primary"
            >
              Open in Email App
            </button>
          </div>

          <div className="tips-section">
            <h4>Tips</h4>
            <ul>
              <li>Keep updates concise and personal</li>
              <li>Include images of new work when possible</li>
              <li>Share upcoming exhibitions or events</li>
              <li>Invite recipients to studio visits</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Newsletter

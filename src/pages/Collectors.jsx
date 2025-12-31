import { useState } from 'react'
import { useCollectors } from '../context/CollectorContext'
import { formatDate, getContactStatus } from '../utils/dateUtils'

function Collectors() {
  const {
    collectors,
    addCollector,
    updateCollector,
    deleteCollector,
    markContacted
  } = useCollectors()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    category: 'collector'
  })
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', notes: '', category: 'collector' })
    setShowForm(false)
    setEditingId(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingId) {
      updateCollector(editingId, formData)
    } else {
      addCollector(formData)
    }
    resetForm()
  }

  const startEdit = (collector) => {
    setFormData({
      name: collector.name,
      email: collector.email,
      phone: collector.phone || '',
      notes: collector.notes || '',
      category: collector.category || 'collector'
    })
    setEditingId(collector.id)
    setShowForm(true)
  }

  const filteredCollectors = collectors.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (filter === 'all') return true
    if (filter === 'due') {
      const status = getContactStatus(c.lastContactedAt)
      return status.urgent
    }
    return c.category === filter
  })

  const exportContacts = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Category', 'Last Contacted', 'Notes'].join(','),
      ...collectors.map(c => [
        `"${c.name}"`,
        c.email,
        c.phone || '',
        c.category,
        c.lastContactedAt || '',
        `"${(c.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'art-contacts.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importContacts = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      const lines = text.split('\n').slice(1)

      lines.forEach(line => {
        if (!line.trim()) return

        const matches = line.match(/(".*?"|[^,]+)/g)
        if (matches && matches.length >= 2) {
          const name = matches[0].replace(/^"|"$/g, '')
          const email = matches[1].replace(/^"|"$/g, '')
          const phone = matches[2]?.replace(/^"|"$/g, '') || ''
          const category = matches[3]?.replace(/^"|"$/g, '') || 'collector'
          const notes = matches[5]?.replace(/^"|"$/g, '').replace(/""/g, '"') || ''

          if (email && !collectors.find(c => c.email === email)) {
            addCollector({ name, email, phone, category, notes })
          }
        }
      })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="collectors-page">
      <div className="page-header">
        <h1>Collectors & Contacts</h1>
        <p>Manage your art network and stay connected</p>
      </div>

      <div className="toolbar">
        <div className="search-filter">
          <input
            type="search"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Contacts</option>
            <option value="due">Due for Outreach</option>
            <option value="collector">Collectors</option>
            <option value="gallery">Galleries</option>
            <option value="curator">Curators</option>
            <option value="press">Press</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="actions">
          <label className="import-btn">
            Import CSV
            <input type="file" accept=".csv" onChange={importContacts} hidden />
          </label>
          <button onClick={exportContacts} className="export-btn">
            Export CSV
          </button>
          <button onClick={() => setShowForm(true)} className="add-btn">
            + Add Contact
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => resetForm()}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Contact' : 'Add New Contact'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="collector">Collector</option>
                  <option value="gallery">Gallery</option>
                  <option value="curator">Curator</option>
                  <option value="press">Press</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={resetForm} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingId ? 'Save Changes' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="contacts-grid">
        {filteredCollectors.length === 0 ? (
          <div className="empty-state">
            <p>No contacts found.</p>
            <button onClick={() => setShowForm(true)}>Add your first contact</button>
          </div>
        ) : (
          filteredCollectors.map(collector => {
            const contactStatus = getContactStatus(collector.lastContactedAt)
            return (
              <div key={collector.id} className={`contact-card ${contactStatus.status}`}>
                <div className="contact-header">
                  <span className="category-badge">{collector.category}</span>
                  {contactStatus.urgent && (
                    <span className="urgent-badge">Needs outreach</span>
                  )}
                </div>
                <h3>{collector.name}</h3>
                <p className="email">{collector.email}</p>
                {collector.phone && <p className="phone">{collector.phone}</p>}
                <p className="last-contact">
                  Last contacted: {contactStatus.label}
                </p>
                {collector.notes && (
                  <p className="notes">{collector.notes}</p>
                )}
                <div className="card-actions">
                  <button
                    onClick={() => markContacted(collector.id)}
                    className="contacted-btn"
                  >
                    Mark Contacted
                  </button>
                  <button onClick={() => startEdit(collector)} className="edit-btn">
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCollector(collector.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Collectors

import { useState, useMemo } from 'react'
import { useCollectors } from '../context/CollectorContext'
import { formatDate, isOverdue, getNextQuarterlyDate, getContactStatus } from '../utils/dateUtils'

function Reminders() {
  const {
    collectors,
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
    markContacted,
    getCollectorsDueForContact
  } = useCollectors()

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    collectorIds: [],
    recurring: 'none'
  })

  const dueCollectors = useMemo(() => getCollectorsDueForContact(90), [collectors])
  const activeReminders = reminders.filter(r => !r.completed)
  const completedReminders = reminders.filter(r => r.completed)

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      collectorIds: [],
      recurring: 'none'
    })
    setShowForm(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    addReminder(formData)

    if (formData.recurring === 'quarterly') {
      const nextDate = getNextQuarterlyDate(new Date(formData.dueDate))
      addReminder({
        ...formData,
        dueDate: nextDate.toISOString().split('T')[0],
        title: formData.title + ' (Q+1)'
      })
    }

    resetForm()
  }

  const createQuarterlyReminder = () => {
    const nextQuarter = getNextQuarterlyDate()
    setFormData({
      title: 'Quarterly Collector Outreach',
      description: 'Time to reach out to your collector network. Send updates on new work, exhibitions, or just check in.',
      dueDate: nextQuarter.toISOString().split('T')[0],
      collectorIds: dueCollectors.map(c => c.id),
      recurring: 'quarterly'
    })
    setShowForm(true)
  }

  const handleMarkContacted = (collectorId) => {
    markContacted(collectorId)
  }

  const getCollectorName = (id) => {
    const collector = collectors.find(c => c.id === id)
    return collector?.name || 'Unknown'
  }

  return (
    <div className="reminders-page">
      <div className="page-header">
        <h1>Outreach Reminders</h1>
        <p>Stay on top of your networking schedule</p>
      </div>

      {dueCollectors.length > 0 && (
        <div className="alert-box">
          <div className="alert-content">
            <h3>Collectors Due for Outreach</h3>
            <p>{dueCollectors.length} contact{dueCollectors.length !== 1 ? 's' : ''} haven't been reached in 90+ days</p>
            <div className="due-collectors-list">
              {dueCollectors.slice(0, 5).map(c => {
                const status = getContactStatus(c.lastContactedAt)
                return (
                  <div key={c.id} className="due-collector-item">
                    <span className="name">{c.name}</span>
                    <span className="status">{status.label}</span>
                    <button onClick={() => handleMarkContacted(c.id)} className="quick-mark-btn">
                      Mark Contacted
                    </button>
                  </div>
                )
              })}
              {dueCollectors.length > 5 && (
                <p className="more-count">+ {dueCollectors.length - 5} more</p>
              )}
            </div>
          </div>
          <button onClick={createQuarterlyReminder} className="create-reminder-btn">
            Create Quarterly Reminder
          </button>
        </div>
      )}

      <div className="toolbar">
        <button onClick={() => setShowForm(true)} className="add-btn">
          + New Reminder
        </button>
        <button onClick={createQuarterlyReminder} className="quarterly-btn">
          Schedule Quarterly Outreach
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Reminder</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Due Date *</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Recurring</label>
                <select
                  value={formData.recurring}
                  onChange={(e) => setFormData({ ...formData, recurring: e.target.value })}
                >
                  <option value="none">One-time</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Link to Collectors</label>
                <div className="collector-checkboxes">
                  {collectors.map(c => (
                    <label key={c.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.collectorIds.includes(c.id)}
                        onChange={(e) => {
                          const ids = e.target.checked
                            ? [...formData.collectorIds, c.id]
                            : formData.collectorIds.filter(id => id !== c.id)
                          setFormData({ ...formData, collectorIds: ids })
                        }}
                      />
                      {c.name}
                    </label>
                  ))}
                  {collectors.length === 0 && (
                    <p className="no-collectors">No collectors added yet</p>
                  )}
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={resetForm} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Create Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="reminders-section">
        <h2>Active Reminders</h2>
        {activeReminders.length === 0 ? (
          <div className="empty-state">
            <p>No active reminders</p>
          </div>
        ) : (
          <div className="reminders-list">
            {activeReminders
              .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
              .map(reminder => (
                <div
                  key={reminder.id}
                  className={`reminder-card ${isOverdue(reminder.dueDate) ? 'overdue' : ''}`}
                >
                  <div className="reminder-content">
                    <h3>{reminder.title}</h3>
                    {reminder.description && <p>{reminder.description}</p>}
                    <div className="reminder-meta">
                      <span className={`due-date ${isOverdue(reminder.dueDate) ? 'overdue' : ''}`}>
                        Due: {formatDate(reminder.dueDate)}
                        {isOverdue(reminder.dueDate) && ' (Overdue)'}
                      </span>
                      {reminder.recurring !== 'none' && (
                        <span className="recurring-badge">{reminder.recurring}</span>
                      )}
                    </div>
                    {reminder.collectorIds?.length > 0 && (
                      <div className="linked-collectors">
                        <span>Linked contacts: </span>
                        {reminder.collectorIds.map(id => getCollectorName(id)).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="reminder-actions">
                    <button
                      onClick={() => completeReminder(reminder.id)}
                      className="complete-btn"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {completedReminders.length > 0 && (
        <div className="reminders-section completed">
          <h2>Completed ({completedReminders.length})</h2>
          <div className="reminders-list">
            {completedReminders.slice(0, 5).map(reminder => (
              <div key={reminder.id} className="reminder-card completed">
                <div className="reminder-content">
                  <h3>{reminder.title}</h3>
                  <span className="completed-date">
                    Completed: {formatDate(reminder.completedAt)}
                  </span>
                </div>
                <button
                  onClick={() => deleteReminder(reminder.id)}
                  className="delete-btn"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Reminders

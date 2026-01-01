import { createContext, useContext, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from './AuthContext'

const CollectorContext = createContext(null)

export function CollectorProvider({ children }) {
  const { sessionToken } = useAuth()

  // Convex queries
  const collectors = useQuery(
    api.collectors.list,
    sessionToken ? { sessionToken } : "skip"
  ) || []

  const reminders = useQuery(
    api.reminders.list,
    sessionToken ? { sessionToken } : "skip"
  ) || []

  const newsletters = useQuery(
    api.newsletters.list,
    sessionToken ? { sessionToken } : "skip"
  ) || []

  // Convex mutations
  const createCollector = useMutation(api.collectors.create)
  const updateCollectorMutation = useMutation(api.collectors.update)
  const removeCollector = useMutation(api.collectors.remove)
  const markContactedMutation = useMutation(api.collectors.markContacted)

  const createReminder = useMutation(api.reminders.create)
  const updateReminderMutation = useMutation(api.reminders.update)
  const removeReminder = useMutation(api.reminders.remove)
  const completeReminderMutation = useMutation(api.reminders.complete)

  const saveNewsletterMutation = useMutation(api.newsletters.save)
  const removeNewsletter = useMutation(api.newsletters.remove)

  const addCollector = async (collector) => {
    try {
      const result = await createCollector({
        sessionToken,
        name: collector.name,
        email: collector.email,
        phone: collector.phone,
        category: collector.category,
        notes: collector.notes,
      })
      return { id: result.id, ...collector }
    } catch (error) {
      console.error('Failed to add collector:', error)
      throw error
    }
  }

  const updateCollector = async (id, updates) => {
    try {
      await updateCollectorMutation({
        sessionToken,
        id,
        ...updates,
      })
    } catch (error) {
      console.error('Failed to update collector:', error)
      throw error
    }
  }

  const deleteCollector = async (id) => {
    try {
      await removeCollector({ sessionToken, id })
    } catch (error) {
      console.error('Failed to delete collector:', error)
      throw error
    }
  }

  const markContacted = async (id) => {
    try {
      await markContactedMutation({ sessionToken, id })
    } catch (error) {
      console.error('Failed to mark contacted:', error)
      throw error
    }
  }

  const addReminder = async (reminder) => {
    try {
      const result = await createReminder({
        sessionToken,
        title: reminder.title,
        description: reminder.description,
        dueDate: reminder.dueDate,
        collectorIds: reminder.collectorIds,
      })
      return { id: result.id, ...reminder }
    } catch (error) {
      console.error('Failed to add reminder:', error)
      throw error
    }
  }

  const updateReminder = async (id, updates) => {
    try {
      await updateReminderMutation({
        sessionToken,
        id,
        ...updates,
      })
    } catch (error) {
      console.error('Failed to update reminder:', error)
      throw error
    }
  }

  const deleteReminder = async (id) => {
    try {
      await removeReminder({ sessionToken, id })
    } catch (error) {
      console.error('Failed to delete reminder:', error)
      throw error
    }
  }

  const completeReminder = async (id) => {
    try {
      await completeReminderMutation({ sessionToken, id })
    } catch (error) {
      console.error('Failed to complete reminder:', error)
      throw error
    }
  }

  const saveNewsletter = async (newsletter) => {
    try {
      const result = await saveNewsletterMutation({
        sessionToken,
        id: newsletter.id,
        subject: newsletter.subject,
        body: newsletter.body,
        recipientIds: newsletter.recipientIds,
      })
      return { id: result.id, ...newsletter }
    } catch (error) {
      console.error('Failed to save newsletter:', error)
      throw error
    }
  }

  const deleteNewsletter = async (id) => {
    try {
      await removeNewsletter({ sessionToken, id })
    } catch (error) {
      console.error('Failed to delete newsletter:', error)
      throw error
    }
  }

  const getDueReminders = () => {
    const now = new Date()
    return reminders.filter(r => !r.completed && new Date(r.dueDate) <= now)
  }

  const getCollectorsDueForContact = (daysSinceLastContact = 90) => {
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - daysSinceLastContact)

    return collectors.filter(c => {
      if (!c.lastContactedAt) return true
      return new Date(c.lastContactedAt) < threshold
    })
  }

  const value = useMemo(() => ({
    collectors,
    reminders,
    newsletters,
    addCollector,
    updateCollector,
    deleteCollector,
    markContacted,
    addReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
    saveNewsletter,
    deleteNewsletter,
    getDueReminders,
    getCollectorsDueForContact
  }), [collectors, reminders, newsletters, sessionToken])

  return (
    <CollectorContext.Provider value={value}>
      {children}
    </CollectorContext.Provider>
  )
}

export function useCollectors() {
  const context = useContext(CollectorContext)
  if (!context) {
    throw new Error('useCollectors must be used within a CollectorProvider')
  }
  return context
}

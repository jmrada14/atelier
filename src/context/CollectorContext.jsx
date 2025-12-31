import { createContext, useContext, useState, useEffect } from 'react'

const CollectorContext = createContext(null)

const STORAGE_KEY = 'atelier_collectors'
const REMINDERS_KEY = 'atelier_reminders'
const NEWSLETTERS_KEY = 'atelier_newsletters'

function loadFromStorage(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function CollectorProvider({ children }) {
  const [collectors, setCollectors] = useState(() => loadFromStorage(STORAGE_KEY, []))
  const [reminders, setReminders] = useState(() => loadFromStorage(REMINDERS_KEY, []))
  const [newsletters, setNewsletters] = useState(() => loadFromStorage(NEWSLETTERS_KEY, []))

  useEffect(() => {
    saveToStorage(STORAGE_KEY, collectors)
  }, [collectors])

  useEffect(() => {
    saveToStorage(REMINDERS_KEY, reminders)
  }, [reminders])

  useEffect(() => {
    saveToStorage(NEWSLETTERS_KEY, newsletters)
  }, [newsletters])

  const addCollector = (collector) => {
    const newCollector = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      lastContactedAt: null,
      ...collector
    }
    setCollectors(prev => [...prev, newCollector])
    return newCollector
  }

  const updateCollector = (id, updates) => {
    setCollectors(prev => prev.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ))
  }

  const deleteCollector = (id) => {
    setCollectors(prev => prev.filter(c => c.id !== id))
  }

  const markContacted = (id) => {
    updateCollector(id, { lastContactedAt: new Date().toISOString() })
  }

  const addReminder = (reminder) => {
    const newReminder = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completed: false,
      ...reminder
    }
    setReminders(prev => [...prev, newReminder])
    return newReminder
  }

  const updateReminder = (id, updates) => {
    setReminders(prev => prev.map(r =>
      r.id === id ? { ...r, ...updates } : r
    ))
  }

  const deleteReminder = (id) => {
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  const completeReminder = (id) => {
    updateReminder(id, { completed: true, completedAt: new Date().toISOString() })
  }

  const saveNewsletter = (newsletter) => {
    const existing = newsletters.find(n => n.id === newsletter.id)
    if (existing) {
      setNewsletters(prev => prev.map(n =>
        n.id === newsletter.id ? { ...n, ...newsletter, updatedAt: new Date().toISOString() } : n
      ))
    } else {
      const newNewsletter = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...newsletter
      }
      setNewsletters(prev => [...prev, newNewsletter])
      return newNewsletter
    }
  }

  const deleteNewsletter = (id) => {
    setNewsletters(prev => prev.filter(n => n.id !== id))
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

  const value = {
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
  }

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

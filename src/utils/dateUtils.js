export function formatDate(dateString) {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function daysSince(dateString) {
  if (!dateString) return null
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now - date
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

export function getNextQuarterlyDate(fromDate = new Date()) {
  const next = new Date(fromDate)
  next.setMonth(next.getMonth() + 3)
  return next
}

export function isOverdue(dateString) {
  if (!dateString) return false
  return new Date(dateString) < new Date()
}

export function getContactStatus(lastContactedAt, thresholdDays = 90) {
  if (!lastContactedAt) {
    return { status: 'never', label: 'Never contacted', urgent: true }
  }

  const days = daysSince(lastContactedAt)

  if (days > thresholdDays) {
    return { status: 'overdue', label: `${days} days ago`, urgent: true }
  }

  if (days > thresholdDays - 14) {
    return { status: 'soon', label: `${days} days ago`, urgent: false }
  }

  return { status: 'recent', label: `${days} days ago`, urgent: false }
}

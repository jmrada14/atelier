import { useState, useEffect, useMemo } from 'react'

const STORAGE_KEY = 'atelier-open-calls'
const PREFERENCES_KEY = 'atelier-artist-preferences'

const generateId = () => `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Default artist preferences for recommendation matching
const defaultPreferences = {
  mediums: [], // e.g., ['painting', 'sculpture', 'photography']
  location: '', // e.g., 'New York, NY'
  careerStage: '', // 'emerging', 'mid-career', 'established'
  themes: [], // e.g., ['abstract', 'figurative', 'conceptual']
  maxEntryFee: null,
  preferNoFee: false,
}

// Calculate recommendation score based on artist preferences
function calculateRecommendationScore(call, preferences) {
  let score = 50 // Base score
  let reasons = []

  // Medium match (strong signal)
  if (preferences.mediums?.length > 0 && call.mediums?.length > 0) {
    const matchingMediums = call.mediums.filter(m =>
      preferences.mediums.some(pm => m.toLowerCase().includes(pm.toLowerCase()) || pm.toLowerCase().includes(m.toLowerCase()))
    )
    if (matchingMediums.length > 0) {
      score += 20
      reasons.push(`Matches your medium: ${matchingMediums.join(', ')}`)
    }
  }

  // Location match
  if (preferences.location && call.location) {
    const prefLoc = preferences.location.toLowerCase()
    const callLoc = call.location.toLowerCase()
    if (callLoc.includes(prefLoc) || prefLoc.includes(callLoc.split(',')[0])) {
      score += 15
      reasons.push('Local opportunity')
    }
  }

  // Career stage match
  if (preferences.careerStage && call.eligibility) {
    const eligLower = call.eligibility.toLowerCase()
    if (eligLower.includes(preferences.careerStage) || eligLower.includes('all')) {
      score += 10
      reasons.push('Matches your career stage')
    }
  }

  // Theme match
  if (preferences.themes?.length > 0 && call.theme) {
    const themeLower = call.theme.toLowerCase()
    const matchingThemes = preferences.themes.filter(t => themeLower.includes(t.toLowerCase()))
    if (matchingThemes.length > 0) {
      score += 15
      reasons.push(`Theme aligns: ${matchingThemes.join(', ')}`)
    }
  }

  // Fee considerations
  if (call.entryFee === 0 || call.entryFee === null) {
    if (preferences.preferNoFee) {
      score += 10
      reasons.push('No entry fee')
    } else {
      score += 5
      reasons.push('Free to apply')
    }
  } else if (preferences.maxEntryFee && call.entryFee <= preferences.maxEntryFee) {
    score += 5
    reasons.push('Within budget')
  } else if (preferences.maxEntryFee && call.entryFee > preferences.maxEntryFee) {
    score -= 10
    reasons.push('Entry fee exceeds budget')
  }

  // Deadline urgency bonus (calls closing soon get slight boost if still open)
  if (call.deadline) {
    const daysUntilDeadline = Math.ceil((new Date(call.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    if (daysUntilDeadline > 0 && daysUntilDeadline <= 14) {
      score += 5
      reasons.push('Closing soon - act fast!')
    }
  }

  // Prestige indicators
  if (call.source === 'NYFA' || call.featured) {
    score += 5
    reasons.push('Featured opportunity')
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    reasons,
    recommendation: score >= 75 ? 'highly-recommended' : score >= 50 ? 'recommended' : 'consider'
  }
}

export function useOpenCalls() {
  // Load saved calls (bookmarked, applied, hidden)
  const [savedCalls, setSavedCalls] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Artist preferences for recommendations
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY)
      return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences
    } catch {
      return defaultPreferences
    }
  })

  // Sample open calls data (in production, this would come from NYFA API or web scraping)
  const [openCalls, setOpenCalls] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastFetched, setLastFetched] = useState(null)

  // Persist saved calls
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCalls))
  }, [savedCalls])

  // Persist preferences
  useEffect(() => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
  }, [preferences])

  // Merge open calls with saved status and calculate recommendations
  const enrichedCalls = useMemo(() => {
    return openCalls.map(call => {
      const savedData = savedCalls.find(s => s.id === call.id) || {}
      const recommendation = calculateRecommendationScore(call, preferences)

      return {
        ...call,
        bookmarked: savedData.bookmarked || false,
        applied: savedData.applied || false,
        hidden: savedData.hidden || false,
        notes: savedData.notes || '',
        applicationStatus: savedData.applicationStatus || null, // 'submitted', 'accepted', 'rejected', 'waitlisted'
        ...recommendation,
      }
    }).sort((a, b) => b.score - a.score) // Sort by recommendation score
  }, [openCalls, savedCalls, preferences])

  // Load sample data (simulating NYFA fetch)
  const fetchOpenCalls = async () => {
    setLoading(true)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Sample data modeled after NYFA listings
    const sampleCalls = [
      {
        id: 'nyfa-001',
        title: 'Spring Group Exhibition',
        organization: 'Brooklyn Art Gallery',
        location: 'Brooklyn, NY',
        deadline: '2025-02-15',
        entryFee: 35,
        description: 'Seeking emerging and mid-career artists for our annual spring group exhibition. All 2D mediums welcome.',
        mediums: ['Painting', 'Drawing', 'Photography', 'Mixed Media'],
        theme: 'Renewal and Transformation',
        eligibility: 'Emerging and mid-career artists',
        prizes: 'Exhibition opportunity, $500 best in show',
        url: 'https://example.com/spring-exhibition',
        source: 'NYFA',
        featured: true,
        type: 'exhibition',
        openDate: '2024-12-01',
      },
      {
        id: 'nyfa-002',
        title: 'Artist Residency Program 2025',
        organization: 'Catskills Art Center',
        location: 'Catskills, NY',
        deadline: '2025-03-01',
        entryFee: 0,
        description: 'Month-long summer residency for artists working in any medium. Housing and studio space provided.',
        mediums: ['All Mediums'],
        theme: 'Open theme',
        eligibility: 'All career stages',
        prizes: 'Housing, studio space, $1500 stipend',
        url: 'https://example.com/catskills-residency',
        source: 'NYFA',
        featured: true,
        type: 'residency',
        openDate: '2024-11-15',
      },
      {
        id: 'nyfa-003',
        title: 'Abstract Expressions Juried Show',
        organization: 'Manhattan Arts Collective',
        location: 'Manhattan, NY',
        deadline: '2025-01-31',
        entryFee: 45,
        description: 'National juried exhibition celebrating abstract art in all forms.',
        mediums: ['Painting', 'Sculpture', 'Mixed Media'],
        theme: 'Abstract, Non-representational',
        eligibility: 'Open to all US-based artists',
        prizes: '$2000 first place, $1000 second place, exhibition',
        url: 'https://example.com/abstract-show',
        source: 'NYFA',
        featured: false,
        type: 'exhibition',
        openDate: '2024-12-15',
      },
      {
        id: 'nyfa-004',
        title: 'Emerging Photographers Grant',
        organization: 'Light & Lens Foundation',
        location: 'National',
        deadline: '2025-02-28',
        entryFee: 25,
        description: 'Supporting emerging photographers with project grants and mentorship opportunities.',
        mediums: ['Photography', 'Digital Photography', 'Film Photography'],
        theme: 'Documentary, Fine Art, Conceptual',
        eligibility: 'Emerging artists with less than 5 years professional experience',
        prizes: '$5000 grant, mentorship program, portfolio review',
        url: 'https://example.com/photo-grant',
        source: 'NYFA',
        featured: true,
        type: 'grant',
        openDate: '2024-12-01',
      },
      {
        id: 'nyfa-005',
        title: 'Sculpture in the Park',
        organization: 'Hudson Valley Arts Council',
        location: 'Hudson Valley, NY',
        deadline: '2025-04-15',
        entryFee: 50,
        description: 'Outdoor sculpture exhibition in scenic Hudson Valley park. Works must withstand outdoor conditions.',
        mediums: ['Sculpture', 'Installation', 'Mixed Media'],
        theme: 'Nature and Environment',
        eligibility: 'Mid-career and established artists',
        prizes: 'Exhibition, $3000 acquisition prize, catalog inclusion',
        url: 'https://example.com/sculpture-park',
        source: 'NYFA',
        featured: false,
        type: 'exhibition',
        openDate: '2025-01-01',
      },
      {
        id: 'nyfa-006',
        title: 'Digital Arts Open Call',
        organization: 'New Media Gallery',
        location: 'Queens, NY',
        deadline: '2025-02-01',
        entryFee: 0,
        description: 'Seeking innovative digital and new media works for upcoming exhibition exploring technology and art.',
        mediums: ['Digital Art', 'Video', 'Installation', 'Interactive'],
        theme: 'Technology, AI, Virtual Reality',
        eligibility: 'All career stages',
        prizes: 'Exhibition, artist talk, $1000 honorarium',
        url: 'https://example.com/digital-arts',
        source: 'NYFA',
        featured: true,
        type: 'exhibition',
        openDate: '2024-12-10',
      },
      {
        id: 'nyfa-007',
        title: 'Community Mural Project',
        organization: 'Bronx Arts Initiative',
        location: 'Bronx, NY',
        deadline: '2025-01-20',
        entryFee: 0,
        description: 'Seeking muralists for public art project celebrating community heritage and diversity.',
        mediums: ['Mural', 'Painting', 'Mixed Media'],
        theme: 'Community, Heritage, Diversity',
        eligibility: 'Local artists preferred, all levels welcome',
        prizes: '$8000 commission, materials provided',
        url: 'https://example.com/bronx-mural',
        source: 'NYFA',
        featured: false,
        type: 'commission',
        openDate: '2024-11-01',
      },
      {
        id: 'nyfa-008',
        title: 'Women in Art Fellowship',
        organization: 'Foundation for Women Artists',
        location: 'National',
        deadline: '2025-03-15',
        entryFee: 30,
        description: 'Supporting women-identifying artists with unrestricted fellowships for artistic development.',
        mediums: ['All Mediums'],
        theme: 'Open theme',
        eligibility: 'Women-identifying artists, mid-career',
        prizes: '$10000 unrestricted fellowship',
        url: 'https://example.com/women-fellowship',
        source: 'NYFA',
        featured: true,
        type: 'fellowship',
        openDate: '2025-01-01',
      },
    ]

    setOpenCalls(sampleCalls)
    setLastFetched(new Date().toISOString())
    setLoading(false)
  }

  // Bookmark/unbookmark a call
  const toggleBookmark = (callId) => {
    setSavedCalls(prev => {
      const existing = prev.find(s => s.id === callId)
      if (existing) {
        return prev.map(s => s.id === callId ? { ...s, bookmarked: !s.bookmarked } : s)
      }
      return [...prev, { id: callId, bookmarked: true }]
    })
  }

  // Mark as applied
  const markApplied = (callId, status = 'submitted') => {
    setSavedCalls(prev => {
      const existing = prev.find(s => s.id === callId)
      if (existing) {
        return prev.map(s => s.id === callId ? { ...s, applied: true, applicationStatus: status } : s)
      }
      return [...prev, { id: callId, applied: true, applicationStatus: status }]
    })
  }

  // Update application status
  const updateApplicationStatus = (callId, status) => {
    setSavedCalls(prev => prev.map(s =>
      s.id === callId ? { ...s, applicationStatus: status } : s
    ))
  }

  // Hide a call
  const toggleHidden = (callId) => {
    setSavedCalls(prev => {
      const existing = prev.find(s => s.id === callId)
      if (existing) {
        return prev.map(s => s.id === callId ? { ...s, hidden: !s.hidden } : s)
      }
      return [...prev, { id: callId, hidden: true }]
    })
  }

  // Add/update notes for a call
  const updateCallNotes = (callId, notes) => {
    setSavedCalls(prev => {
      const existing = prev.find(s => s.id === callId)
      if (existing) {
        return prev.map(s => s.id === callId ? { ...s, notes } : s)
      }
      return [...prev, { id: callId, notes }]
    })
  }

  // Update artist preferences
  const updatePreferences = (newPrefs) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }))
  }

  // Add a custom call (manual entry)
  const addCustomCall = (callData) => {
    const newCall = {
      id: generateId(),
      ...callData,
      source: 'Manual',
      featured: false,
      openDate: new Date().toISOString().split('T')[0],
    }
    setOpenCalls(prev => [newCall, ...prev])
    return newCall
  }

  return {
    // Data
    calls: enrichedCalls,
    preferences,
    loading,
    lastFetched,

    // Actions
    fetchOpenCalls,
    toggleBookmark,
    markApplied,
    updateApplicationStatus,
    toggleHidden,
    updateCallNotes,
    updatePreferences,
    addCustomCall,
  }
}

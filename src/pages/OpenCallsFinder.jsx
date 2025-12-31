import { useState, useMemo, useEffect } from 'react'
import { useOpenCalls } from '../hooks/useOpenCalls'
import CallCard from '../components/CallCard'

const FILTERS = [
  { key: 'all', label: 'All Calls' },
  { key: 'recommended', label: 'Recommended' },
  { key: 'bookmarked', label: 'Bookmarked' },
  { key: 'applied', label: 'Applied' },
]

const TYPE_FILTERS = [
  { key: 'all', label: 'All Types' },
  { key: 'exhibition', label: 'Exhibitions' },
  { key: 'residency', label: 'Residencies' },
  { key: 'grant', label: 'Grants' },
  { key: 'fellowship', label: 'Fellowships' },
  { key: 'commission', label: 'Commissions' },
]

const MEDIUM_OPTIONS = [
  'Painting', 'Drawing', 'Sculpture', 'Photography', 'Mixed Media',
  'Digital Art', 'Video', 'Installation', 'Performance', 'Printmaking',
  'Ceramics', 'Textile', 'Fiber', 'Glass', 'Metal', 'Wood',
]

const CAREER_STAGES = [
  { value: '', label: 'Any career stage' },
  { value: 'emerging', label: 'Emerging' },
  { value: 'mid-career', label: 'Mid-career' },
  { value: 'established', label: 'Established' },
]

function OpenCallsFinder() {
  const {
    calls,
    preferences,
    loading,
    lastFetched,
    fetchOpenCalls,
    toggleBookmark,
    markApplied,
    toggleHidden,
    updatePreferences,
  } = useOpenCalls()

  const [activeFilter, setActiveFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showPreferences, setShowPreferences] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showHidden, setShowHidden] = useState(false)

  // Fetch calls on mount if not already loaded
  useEffect(() => {
    if (calls.length === 0 && !loading) {
      fetchOpenCalls()
    }
  }, [])

  // Filter calls based on current filters
  const filteredCalls = useMemo(() => {
    let result = calls

    // Hide hidden calls unless viewing them
    if (!showHidden) {
      result = result.filter(call => !call.hidden)
    }

    // Main filter
    if (activeFilter === 'recommended') {
      result = result.filter(call => call.score >= 50)
    } else if (activeFilter === 'bookmarked') {
      result = result.filter(call => call.bookmarked)
    } else if (activeFilter === 'applied') {
      result = result.filter(call => call.applied)
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(call => call.type === typeFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(call =>
        call.title.toLowerCase().includes(query) ||
        call.organization.toLowerCase().includes(query) ||
        call.location?.toLowerCase().includes(query) ||
        call.theme?.toLowerCase().includes(query) ||
        call.mediums?.some(m => m.toLowerCase().includes(query))
      )
    }

    return result
  }, [calls, activeFilter, typeFilter, searchQuery, showHidden])

  // Stats for header
  const stats = useMemo(() => ({
    total: calls.filter(c => !c.hidden).length,
    recommended: calls.filter(c => c.score >= 75 && !c.hidden).length,
    bookmarked: calls.filter(c => c.bookmarked).length,
    closingSoon: calls.filter(c => {
      if (!c.deadline || c.hidden) return false
      const days = Math.ceil((new Date(c.deadline) - new Date()) / (1000 * 60 * 60 * 24))
      return days > 0 && days <= 7
    }).length,
  }), [calls])

  const handleMediumToggle = (medium) => {
    const currentMediums = preferences.mediums || []
    const newMediums = currentMediums.includes(medium)
      ? currentMediums.filter(m => m !== medium)
      : [...currentMediums, medium]
    updatePreferences({ mediums: newMediums })
  }

  return (
    <>
      <div className="calls-header">
        <div>
          <h2 className="calls-title">Open Calls</h2>
          <p className="calls-subtitle">
            {stats.total === 0
              ? 'Discover opportunities for your art'
              : `${stats.total} opportunities • ${stats.recommended} highly recommended • ${stats.closingSoon} closing soon`}
          </p>
        </div>
        <div className="calls-header-actions">
          <button
            className={`action-btn ${showPreferences ? 'active' : ''}`}
            onClick={() => setShowPreferences(!showPreferences)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Preferences
          </button>
          <button
            className="action-btn primary"
            onClick={fetchOpenCalls}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh Calls'}
          </button>
        </div>
      </div>

      {showPreferences && (
        <div className="preferences-panel">
          <h3 className="preferences-title">Your Artist Profile</h3>
          <p className="preferences-subtitle">
            Help us find the best opportunities for you
          </p>

          <div className="preferences-grid">
            <div className="pref-section">
              <label className="pref-label">Your Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Brooklyn, NY"
                value={preferences.location || ''}
                onChange={(e) => updatePreferences({ location: e.target.value })}
              />
            </div>

            <div className="pref-section">
              <label className="pref-label">Career Stage</label>
              <select
                className="form-select"
                value={preferences.careerStage || ''}
                onChange={(e) => updatePreferences({ careerStage: e.target.value })}
              >
                {CAREER_STAGES.map(stage => (
                  <option key={stage.value} value={stage.value}>{stage.label}</option>
                ))}
              </select>
            </div>

            <div className="pref-section">
              <label className="pref-label">Max Entry Fee</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g., 50"
                value={preferences.maxEntryFee || ''}
                onChange={(e) => updatePreferences({ maxEntryFee: e.target.value ? Number(e.target.value) : null })}
              />
            </div>

            <div className="pref-section checkbox-section">
              <label className="pref-checkbox">
                <input
                  type="checkbox"
                  checked={preferences.preferNoFee || false}
                  onChange={(e) => updatePreferences({ preferNoFee: e.target.checked })}
                />
                <span>Prefer no-fee opportunities</span>
              </label>
            </div>
          </div>

          <div className="pref-section full-width">
            <label className="pref-label">Your Mediums</label>
            <div className="medium-tags">
              {MEDIUM_OPTIONS.map(medium => (
                <button
                  key={medium}
                  className={`medium-select-tag ${preferences.mediums?.includes(medium) ? 'selected' : ''}`}
                  onClick={() => handleMediumToggle(medium)}
                >
                  {medium}
                </button>
              ))}
            </div>
          </div>

          <div className="pref-section full-width">
            <label className="pref-label">Themes & Interests</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., abstract, figurative, conceptual (comma separated)"
              value={preferences.themes?.join(', ') || ''}
              onChange={(e) => updatePreferences({
                themes: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              })}
            />
          </div>
        </div>
      )}

      <div className="calls-filters">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search calls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-row">
          <div className="filters">
            {FILTERS.map(filter => (
              <button
                key={filter.key}
                className={`filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
                {filter.key === 'bookmarked' && stats.bookmarked > 0 && (
                  <span className="filter-count">{stats.bookmarked}</span>
                )}
              </button>
            ))}
          </div>

          <div className="type-filters">
            <select
              className="type-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {TYPE_FILTERS.map(filter => (
                <option key={filter.key} value={filter.key}>{filter.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Fetching open calls from NYFA and other sources...</p>
        </div>
      ) : filteredCalls.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <h3>No calls found</h3>
          <p>
            {activeFilter === 'bookmarked'
              ? 'You haven\'t bookmarked any calls yet'
              : activeFilter === 'applied'
              ? 'You haven\'t marked any applications yet'
              : searchQuery
              ? 'Try adjusting your search terms'
              : 'Try refreshing or adjusting your filters'}
          </p>
          {calls.length === 0 && (
            <button className="action-btn primary" onClick={fetchOpenCalls}>
              Load Open Calls
            </button>
          )}
        </div>
      ) : (
        <div className="calls-grid">
          {filteredCalls.map(call => (
            <CallCard
              key={call.id}
              call={call}
              onBookmark={toggleBookmark}
              onApply={markApplied}
              onHide={toggleHidden}
            />
          ))}
        </div>
      )}

      {calls.some(c => c.hidden) && !showHidden && (
        <div className="hidden-notice">
          <button onClick={() => setShowHidden(true)}>
            Show {calls.filter(c => c.hidden).length} hidden calls
          </button>
        </div>
      )}

      {lastFetched && (
        <div className="calls-footer">
          <p>
            Data sourced from NYFA and partner galleries.
            Last updated: {new Date(lastFetched).toLocaleString()}
          </p>
        </div>
      )}
    </>
  )
}

export default OpenCallsFinder

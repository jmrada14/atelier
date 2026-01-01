import { useState, useRef, useEffect } from 'react'
import { useLocationAutocomplete } from '../hooks/useLocationAutocomplete'

function LocationInput({ value, onChange, placeholder = 'Enter location' }) {
  const { query, setQuery, suggestions, isLoading } = useLocationAutocomplete()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapperRef = useRef(null)

  // Initialize query with value
  useEffect(() => {
    if (value && value !== query) {
      setQuery(value)
    }
  }, [value])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setQuery(newValue)
    onChange(newValue)
    setShowSuggestions(true)
  }

  const handleSelectSuggestion = (suggestion) => {
    const locationValue = suggestion.formatted || suggestion.display_name
    setQuery(locationValue)
    onChange(locationValue)
    setShowSuggestions(false)
  }

  return (
    <div className="location-input-wrapper" ref={wrapperRef}>
      <input
        type="text"
        className="form-input"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="location-suggestions">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="location-suggestion-item"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div className="suggestion-main">
                {suggestion.city || suggestion.display_name.split(',')[0]}
              </div>
              <div className="suggestion-detail">{suggestion.formatted}</div>
            </div>
          ))}
        </div>
      )}
      {isLoading && <div className="location-loading">Searching...</div>}
    </div>
  )
}

export default LocationInput

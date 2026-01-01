import { useState, useEffect, useCallback } from 'react'

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search'

// Debounce helper
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useLocationAutocomplete() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 3) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          format: 'json',
          addressdetails: '1',
          limit: '5',
        })

        const response = await fetch(`${NOMINATIM_BASE_URL}?${params}`, {
          headers: {
            'User-Agent': 'Atelier-App/1.0',
          },
        })

        if (!response.ok) throw new Error('Failed to fetch suggestions')

        const data = await response.json()

        // Format suggestions to show city, state, country
        const formatted = data.map(item => ({
          id: item.place_id,
          display_name: item.display_name,
          city: item.address?.city || item.address?.town || item.address?.village || '',
          state: item.address?.state || '',
          country: item.address?.country || '',
          formatted: formatLocation(item.address),
        }))

        setSuggestions(formatted)
      } catch (error) {
        console.error('Location autocomplete error:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery])

  const formatLocation = (address) => {
    if (!address) return ''

    const parts = []

    // Add city/town
    if (address.city) parts.push(address.city)
    else if (address.town) parts.push(address.town)
    else if (address.village) parts.push(address.village)

    // Add state
    if (address.state) parts.push(address.state)

    // Add country
    if (address.country) parts.push(address.country)

    return parts.join(', ')
  }

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
  }
}

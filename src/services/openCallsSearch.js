/**
 * Open Calls Web Search Service
 *
 * Searches multiple art-related sources to find open calls, residencies,
 * grants, and exhibition opportunities for artists.
 */

// Art opportunity sources to search
const SEARCH_SOURCES = {
  // Major art databases and foundations
  NYFA: {
    name: 'NYFA (New York Foundation for the Arts)',
    searchTerms: ['NYFA open call', 'NYFA artist opportunity', 'NYFA grant 2025'],
    baseUrl: 'https://www.nyfa.org',
  },
  CAFE: {
    name: 'CaFÉ (Call for Entry)',
    searchTerms: ['CaFE call for entry art', 'callforentry.org exhibition 2025'],
    baseUrl: 'https://www.callforentry.org',
  },
  SUBMITTABLE: {
    name: 'Submittable Art Calls',
    searchTerms: ['submittable art open call', 'submittable visual art grant 2025'],
    baseUrl: 'https://www.submittable.com',
  },
  ARTWORK_ARCHIVE: {
    name: 'Artwork Archive',
    searchTerms: ['artwork archive open call', 'artwork archive opportunity 2025'],
    baseUrl: 'https://www.artworkarchive.com',
  },
  ARTISTS_NETWORK: {
    name: 'Artists Network',
    searchTerms: ['artists network call for art', 'art competition 2025'],
    baseUrl: 'https://www.artistsnetwork.com',
  },
  // Residency-specific
  RES_ARTIS: {
    name: 'Res Artis',
    searchTerms: ['res artis residency', 'artist residency 2025 open call'],
    baseUrl: 'https://resartis.org',
  },
  TRANSARTISTS: {
    name: 'TransArtists',
    searchTerms: ['transartists residency', 'art residency opportunity 2025'],
    baseUrl: 'https://www.transartists.org',
  },
  // Grants
  FOUNDATION_CENTER: {
    name: 'Foundation Center/Candid',
    searchTerms: ['artist grant 2025', 'visual arts foundation grant'],
    baseUrl: 'https://candid.org',
  },
  ARTS_COUNCIL: {
    name: 'Arts Council/Regional',
    searchTerms: ['arts council grant 2025', 'regional arts grant artist'],
    baseUrl: '',
  },
  // General art opportunities
  ART_DEADLINE: {
    name: 'Art Deadline',
    searchTerms: ['art deadline open call', 'art deadline 2025'],
    baseUrl: 'https://artdeadline.com',
  },
  WOOLOO: {
    name: 'Wooloo.org',
    searchTerms: ['wooloo open call art', 'wooloo exhibition 2025'],
    baseUrl: 'https://www.wooloo.org',
  },
}

// Additional search queries by opportunity type
const TYPE_SEARCH_QUERIES = {
  exhibition: [
    'open call for art exhibition 2025',
    'juried art show accepting submissions',
    'gallery open call 2025',
    'group exhibition call for artists',
    'solo exhibition opportunity 2025',
    'museum open call contemporary art',
  ],
  residency: [
    'artist residency accepting applications 2025',
    'art residency stipend housing 2025',
    'international artist residency open call',
    'summer artist residency 2025',
    'artist in residence program 2025',
  ],
  grant: [
    'artist grant 2025 application',
    'visual arts grant emerging artists',
    'art funding opportunity 2025',
    'individual artist grant application',
    'project grant for artists 2025',
    'unrestricted artist grant',
  ],
  fellowship: [
    'artist fellowship 2025',
    'visual arts fellowship application',
    'creative fellowship program 2025',
    'arts fellowship emerging mid-career',
  ],
  commission: [
    'public art commission 2025',
    'art commission opportunity',
    'mural commission call for artists',
    'sculpture commission public art',
  ],
}

// Medium-specific search queries
const MEDIUM_SEARCH_QUERIES = {
  painting: ['painting exhibition open call', 'painter grant 2025'],
  sculpture: ['sculpture open call 2025', 'sculptor residency opportunity'],
  photography: ['photography call for entry 2025', 'photo exhibition open call'],
  'digital art': ['digital art open call', 'new media art opportunity 2025'],
  printmaking: ['printmaking exhibition 2025', 'print art open call'],
  ceramics: ['ceramics open call 2025', 'ceramic art exhibition'],
  'mixed media': ['mixed media art call 2025', 'multimedia artist opportunity'],
  installation: ['installation art open call', 'site-specific art opportunity 2025'],
  video: ['video art open call 2025', 'moving image art exhibition'],
  textile: ['textile art open call', 'fiber art exhibition 2025'],
}

/**
 * Parse deadline from text, handling various formats
 */
function parseDeadline(text) {
  if (!text) return null

  // Common date patterns
  const patterns = [
    // "January 15, 2025" or "Jan 15, 2025"
    /(\w+)\s+(\d{1,2}),?\s*(\d{4})/i,
    // "15 January 2025"
    /(\d{1,2})\s+(\w+)\s+(\d{4})/i,
    // "2025-01-15" or "2025/01/15"
    /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,
    // "01/15/2025" or "01-15-2025"
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/,
  ]

  const months = {
    january: 0, jan: 0,
    february: 1, feb: 1,
    march: 2, mar: 2,
    april: 3, apr: 3,
    may: 4,
    june: 5, jun: 5,
    july: 6, jul: 6,
    august: 7, aug: 7,
    september: 8, sep: 8, sept: 8,
    october: 9, oct: 9,
    november: 10, nov: 10,
    december: 11, dec: 11,
  }

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      try {
        let year, month, day

        if (/^\d{4}$/.test(match[1])) {
          // YYYY-MM-DD format
          year = parseInt(match[1])
          month = parseInt(match[2]) - 1
          day = parseInt(match[3])
        } else if (/^\d{1,2}$/.test(match[1]) && /^\w+$/.test(match[2])) {
          // DD Month YYYY
          day = parseInt(match[1])
          month = months[match[2].toLowerCase()]
          year = parseInt(match[3])
        } else if (/^\w+$/.test(match[1])) {
          // Month DD, YYYY
          month = months[match[1].toLowerCase()]
          day = parseInt(match[2])
          year = parseInt(match[3])
        } else {
          // MM/DD/YYYY
          month = parseInt(match[1]) - 1
          day = parseInt(match[2])
          year = parseInt(match[3])
        }

        if (month !== undefined && !isNaN(year) && !isNaN(day)) {
          const date = new Date(year, month, day)
          return date.toISOString().split('T')[0]
        }
      } catch (e) {
        continue
      }
    }
  }

  return null
}

/**
 * Extract entry fee from text
 */
function parseEntryFee(text) {
  if (!text) return null

  // Check for free/no fee
  if (/\b(free|no fee|no entry fee|fee waived|complimentary)\b/i.test(text)) {
    return 0
  }

  // Extract dollar amount
  const feeMatch = text.match(/\$\s*(\d+(?:\.\d{2})?)/i) ||
                   text.match(/(\d+)\s*(?:USD|dollars?)/i) ||
                   text.match(/fee[:\s]+\$?(\d+)/i)

  if (feeMatch) {
    return parseFloat(feeMatch[1])
  }

  return null
}

/**
 * Determine opportunity type from text
 */
function determineType(text) {
  const textLower = text.toLowerCase()

  if (/\b(residency|artist[- ]in[- ]residence|live[- ]work)\b/i.test(textLower)) {
    return 'residency'
  }
  if (/\b(grant|funding|award|prize money|stipend)\b/i.test(textLower)) {
    return 'grant'
  }
  if (/\b(fellowship|fellow)\b/i.test(textLower)) {
    return 'fellowship'
  }
  if (/\b(commission|public art|mural)\b/i.test(textLower)) {
    return 'commission'
  }
  // Default to exhibition
  return 'exhibition'
}

/**
 * Extract mediums from text
 */
function extractMediums(text) {
  const mediums = []
  const mediumPatterns = [
    { pattern: /\b(painting|painter|oil|acrylic|watercolor)\b/i, medium: 'Painting' },
    { pattern: /\b(drawing|graphite|pencil|charcoal)\b/i, medium: 'Drawing' },
    { pattern: /\b(sculpture|sculptor|3d|three[- ]dimensional)\b/i, medium: 'Sculpture' },
    { pattern: /\b(photograph|photo|camera|lens[- ]based)\b/i, medium: 'Photography' },
    { pattern: /\b(mixed media|multimedia|interdisciplinary)\b/i, medium: 'Mixed Media' },
    { pattern: /\b(digital|new media|computer|AI|generative)\b/i, medium: 'Digital Art' },
    { pattern: /\b(video|film|moving image|animation)\b/i, medium: 'Video' },
    { pattern: /\b(installation|site[- ]specific|immersive)\b/i, medium: 'Installation' },
    { pattern: /\b(print|printmaking|etching|lithograph|screen print)\b/i, medium: 'Printmaking' },
    { pattern: /\b(ceramic|pottery|clay)\b/i, medium: 'Ceramics' },
    { pattern: /\b(textile|fiber|fabric|weaving)\b/i, medium: 'Textile' },
    { pattern: /\b(glass|blown glass)\b/i, medium: 'Glass' },
    { pattern: /\b(metal|bronze|steel|iron)\b/i, medium: 'Metal' },
    { pattern: /\b(wood|woodwork|carving)\b/i, medium: 'Wood' },
    { pattern: /\b(performance|performative)\b/i, medium: 'Performance' },
  ]

  for (const { pattern, medium } of mediumPatterns) {
    if (pattern.test(text) && !mediums.includes(medium)) {
      mediums.push(medium)
    }
  }

  // Check for "all mediums" or similar
  if (/\b(all media|all mediums|any medium|open to all)\b/i.test(text)) {
    return ['All Mediums']
  }

  return mediums.length > 0 ? mediums : ['All Mediums']
}

/**
 * Extract location from text
 */
function extractLocation(text) {
  // US States
  const statePatterns = [
    /\b(New York|NY|NYC|Brooklyn|Manhattan|Queens|Bronx)\b/i,
    /\b(Los Angeles|LA|California|CA|San Francisco|SF)\b/i,
    /\b(Chicago|Illinois|IL)\b/i,
    /\b(Miami|Florida|FL)\b/i,
    /\b(Texas|TX|Austin|Houston|Dallas)\b/i,
    /\b(Washington|DC|Seattle|WA)\b/i,
    /\b(Massachusetts|MA|Boston)\b/i,
    /\b(Pennsylvania|PA|Philadelphia)\b/i,
    /\b(Colorado|CO|Denver)\b/i,
    /\b(Oregon|OR|Portland)\b/i,
  ]

  for (const pattern of statePatterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1]
    }
  }

  // International patterns
  if (/\b(international|worldwide|global)\b/i.test(text)) {
    return 'International'
  }
  if (/\b(national|nationwide|USA|United States)\b/i.test(text)) {
    return 'National'
  }
  if (/\b(online|virtual|remote)\b/i.test(text)) {
    return 'Online/Virtual'
  }

  // European locations
  const euPatterns = [
    /\b(London|UK|United Kingdom|Britain)\b/i,
    /\b(Paris|France)\b/i,
    /\b(Berlin|Germany)\b/i,
    /\b(Amsterdam|Netherlands)\b/i,
    /\b(Italy|Rome|Milan|Venice)\b/i,
    /\b(Spain|Madrid|Barcelona)\b/i,
  ]

  for (const pattern of euPatterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return 'Various Locations'
}

/**
 * Check if a deadline has passed
 */
function isDeadlinePassed(deadline) {
  if (!deadline) return false
  const deadlineDate = new Date(deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return deadlineDate < today
}

/**
 * Generate a unique ID for an open call
 */
function generateCallId(source, title) {
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 5)
  return `${source}-${cleanTitle}-${timestamp}-${random}`
}

/**
 * Normalize and deduplicate results
 */
function deduplicateResults(results) {
  const seen = new Map()

  return results.filter(result => {
    // Create a normalized key for deduplication
    const key = `${result.title.toLowerCase().trim()}-${result.organization?.toLowerCase().trim() || ''}`

    if (seen.has(key)) {
      return false
    }

    seen.set(key, true)
    return true
  })
}

/**
 * Parse search results into structured open call data
 */
function parseSearchResult(result, source) {
  const title = result.title || ''
  const snippet = result.snippet || result.description || ''
  const url = result.url || result.link || ''
  const fullText = `${title} ${snippet}`

  // Skip if it looks like old/past content
  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1

  // Check for past years in title (excluding current and future)
  const yearMatch = title.match(/\b(20\d{2})\b/)
  if (yearMatch) {
    const year = parseInt(yearMatch[1])
    if (year < lastYear) {
      return null // Skip calls from before last year
    }
  }

  // Parse the deadline
  let deadline = parseDeadline(fullText)

  // If no deadline found, try to extract from URL or other context
  if (!deadline) {
    // Look for future months mentioned
    const futureMonthMatch = fullText.match(/deadline[:\s]*(january|february|march|april|may|june|july|august|september|october|november|december)/i)
    if (futureMonthMatch) {
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
      const monthIndex = monthNames.indexOf(futureMonthMatch[1].toLowerCase())
      if (monthIndex !== -1) {
        const year = monthIndex < new Date().getMonth() ? currentYear + 1 : currentYear
        deadline = new Date(year, monthIndex, 15).toISOString().split('T')[0]
      }
    }
  }

  // Skip if deadline has clearly passed
  if (deadline && isDeadlinePassed(deadline)) {
    return null
  }

  // Extract organization from title or snippet
  let organization = ''
  const orgPatterns = [
    /(?:by|from|presented by|hosted by|at)\s+([A-Z][^,.\n]+)/i,
    /([A-Z][^,.\n]+)\s+(?:presents|announces|invites|seeks|is seeking)/i,
  ]

  for (const pattern of orgPatterns) {
    const match = snippet.match(pattern)
    if (match) {
      organization = match[1].trim()
      break
    }
  }

  if (!organization) {
    // Try to extract from URL domain
    try {
      const urlObj = new URL(url)
      organization = urlObj.hostname.replace('www.', '').split('.')[0]
      organization = organization.charAt(0).toUpperCase() + organization.slice(1)
    } catch (e) {
      organization = source
    }
  }

  // Extract theme from snippet
  let theme = ''
  const themePatterns = [
    /theme[:\s]+([^.]+)/i,
    /exploring[:\s]+([^.]+)/i,
    /focused on[:\s]+([^.]+)/i,
    /celebrating[:\s]+([^.]+)/i,
  ]

  for (const pattern of themePatterns) {
    const match = snippet.match(pattern)
    if (match) {
      theme = match[1].trim()
      break
    }
  }

  return {
    id: generateCallId(source, title),
    title: title.trim(),
    organization,
    location: extractLocation(fullText),
    deadline,
    entryFee: parseEntryFee(fullText),
    description: snippet.trim(),
    mediums: extractMediums(fullText),
    theme: theme || 'Open theme',
    eligibility: /emerging/i.test(fullText) ? 'Emerging artists' :
                 /mid[- ]career/i.test(fullText) ? 'Mid-career artists' :
                 /established/i.test(fullText) ? 'Established artists' :
                 'All career stages',
    prizes: '',
    url,
    source,
    featured: false,
    type: determineType(fullText),
    openDate: new Date().toISOString().split('T')[0],
    fetchedAt: new Date().toISOString(),
  }
}

/**
 * Search for open calls using web search
 * @param {Object} options - Search options
 * @param {string[]} options.types - Types to search for (exhibition, residency, grant, fellowship, commission)
 * @param {string[]} options.mediums - Mediums to prioritize
 * @param {string} options.location - Preferred location
 * @param {number} options.maxResults - Maximum results per source
 * @returns {Promise<Object[]>} - Array of parsed open calls
 */
export async function searchOpenCalls(options = {}) {
  const {
    types = ['exhibition', 'residency', 'grant', 'fellowship', 'commission'],
    mediums = [],
    location = '',
    maxResults = 50,
  } = options

  const allQueries = new Set()

  // Add source-specific queries
  Object.values(SEARCH_SOURCES).forEach(source => {
    source.searchTerms.forEach(term => allQueries.add(term))
  })

  // Add type-specific queries
  types.forEach(type => {
    if (TYPE_SEARCH_QUERIES[type]) {
      TYPE_SEARCH_QUERIES[type].forEach(query => allQueries.add(query))
    }
  })

  // Add medium-specific queries
  mediums.forEach(medium => {
    const mediumKey = medium.toLowerCase()
    if (MEDIUM_SEARCH_QUERIES[mediumKey]) {
      MEDIUM_SEARCH_QUERIES[mediumKey].forEach(query => allQueries.add(query))
    }
  })

  // Add location-specific queries
  if (location) {
    allQueries.add(`art open call ${location} 2025`)
    allQueries.add(`artist opportunity ${location}`)
  }

  // Add general current opportunity queries
  allQueries.add('art open call 2025 deadline')
  allQueries.add('artist opportunity accepting submissions 2025')
  allQueries.add('call for artists deadline 2025')
  allQueries.add('juried art exhibition 2025')

  return {
    queries: Array.from(allQueries),
    sources: Object.keys(SEARCH_SOURCES),
    parseResult: parseSearchResult,
    deduplicate: deduplicateResults,
    isDeadlinePassed,
    maxResults,
  }
}

/**
 * Validate and clean up fetched results
 */
export function validateResults(results) {
  return results
    .filter(result => {
      // Must have a title
      if (!result.title || result.title.length < 5) return false

      // Must have a URL
      if (!result.url) return false

      // Skip past deadlines
      if (result.deadline && isDeadlinePassed(result.deadline)) return false

      // Skip if title contains obvious spam/irrelevant content
      const spamPatterns = [
        /\b(buy|sell|price|cheap|discount)\b/i,
        /\b(login|signin|register|account)\b/i,
        /\b(error|404|not found)\b/i,
      ]

      for (const pattern of spamPatterns) {
        if (pattern.test(result.title)) return false
      }

      return true
    })
    .map(result => ({
      ...result,
      // Ensure required fields have defaults
      mediums: result.mediums || ['All Mediums'],
      type: result.type || 'exhibition',
      eligibility: result.eligibility || 'All career stages',
      theme: result.theme || 'Open theme',
    }))
}

export const SOURCES = SEARCH_SOURCES
export const TYPE_QUERIES = TYPE_SEARCH_QUERIES
export const MEDIUM_QUERIES = MEDIUM_SEARCH_QUERIES

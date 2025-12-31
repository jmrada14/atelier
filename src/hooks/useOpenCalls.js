import { useState, useEffect, useMemo, useCallback } from 'react'

const STORAGE_KEY = 'atelier-open-calls'
const PREFERENCES_KEY = 'atelier-artist-preferences'
const FETCHED_CALLS_KEY = 'atelier-fetched-calls'
const LAST_FETCH_KEY = 'atelier-last-fetch'

const generateId = () => `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// External data sources for open calls
export const DATA_SOURCES = {
  NYFA: { name: 'NYFA', url: 'https://www.nyfa.org/opportunities/', color: '#4a6741' },
  CAFE: { name: 'CaFÉ', url: 'https://artist.callforentry.org/festivals.php', color: '#8b5a2b' },
  ARTWORK_ARCHIVE: { name: 'Artwork Archive', url: 'https://www.artworkarchive.com/call-for-entry', color: '#6b4423' },
  ARTCALL: { name: 'ArtCall.org', url: 'https://artcall.org/calls', color: '#2d5a27' },
  RES_ARTIS: { name: 'Res Artis', url: 'https://resartis.org/open-calls/', color: '#4a3728' },
  CREATIVE_CAPITAL: { name: 'Creative Capital', url: 'https://creative-capital.org/artist-resources/artist-opportunities/', color: '#5d4e37' },
  ARTCONNECT: { name: 'ArtConnect', url: 'https://www.artconnect.com/opportunities/opencalls', color: '#3d5c3d' },
  COLOSSAL: { name: 'Colossal', url: 'https://www.thisiscolossal.com/', color: '#704214' },
  FRACTURED_ATLAS: { name: 'Fractured Atlas', url: 'https://blog.fracturedatlas.org/', color: '#8b4513' },
  AMERICANS_FOR_ARTS: { name: 'Americans for the Arts', url: 'https://www.americansforthearts.org/', color: '#556b2f' },
}

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

  // Curated open calls data from real sources (web search aggregated)
  // Updated regularly from: NYFA, CaFÉ, Artwork Archive, ArtCall.org, Res Artis, Creative Capital, etc.
  const getCuratedOpenCalls = useCallback(() => {
    const today = new Date()
    const currentYear = today.getFullYear()

    return [
      // === EXHIBITIONS ===
      {
        id: 'teravarna-portrait-2025',
        title: 'TERAVARNA 12th International Online Portrait Competition',
        organization: 'TERAVARNA',
        location: 'International/Online',
        deadline: '2025-12-31',
        entryFee: null,
        description: 'Explore portraiture across 2D and 3D mediums in this prestigious international competition. Cash prizes up to $3,500 awarded.',
        mediums: ['Painting', 'Sculpture', 'Drawing', 'Photography', 'Mixed Media'],
        theme: 'Portraiture',
        eligibility: 'All career stages, international',
        prizes: 'Cash prizes up to $3,500',
        url: 'https://artcall.org/calls',
        source: 'ArtCall.org',
        featured: true,
        type: 'exhibition',
        openDate: '2025-01-01',
      },
      {
        id: 'pleinair-salon-2025',
        title: '15th Annual PleinAir Salon',
        organization: 'PleinAir Magazine',
        location: 'International/Online',
        deadline: '2025-12-31',
        entryFee: null,
        description: 'Online art competition open to a variety of mediums and styles. $2,250 awarded monthly with Grand Prize of $15,000.',
        mediums: ['Painting', 'Drawing', 'Mixed Media'],
        theme: 'Plein Air, Landscapes',
        eligibility: 'All career stages',
        prizes: '$2,250 monthly, $15,000 Grand Prize',
        url: 'https://artcall.org/calls',
        source: 'ArtCall.org',
        featured: true,
        type: 'exhibition',
        openDate: '2025-01-01',
      },
      {
        id: 'mega-art-booster-2026',
        title: 'Mega Art Booster 2026',
        organization: 'Biafarin',
        location: 'International',
        deadline: '2025-12-31',
        entryFee: 0,
        description: 'Free year-end global art initiative open to all styles, mediums, and experience levels. Connects artists to collectors and curators through cash grants and exhibitions.',
        mediums: ['All Mediums'],
        theme: 'Open theme',
        eligibility: 'All career stages',
        prizes: 'Cash grants, exhibition opportunities',
        url: 'https://artcall.org/calls',
        source: 'ArtCall.org',
        featured: true,
        type: 'exhibition',
        openDate: '2025-10-01',
      },
      {
        id: 'mca-25-years-2026',
        title: '25 Years of Creativity Exhibition',
        organization: 'Brick City Center for the Arts',
        location: 'Ocala, FL',
        deadline: '2025-12-28',
        entryFee: 40,
        description: 'Celebrating 25 years of creativity with 5 categories: Painting, Sculpture, Photography, Drawing/Pastels, Mixed Media. Opening reception January 9, 2026.',
        mediums: ['Painting', 'Sculpture', 'Photography', 'Drawing', 'Mixed Media'],
        theme: 'Celebrating Creativity',
        eligibility: 'All career stages',
        prizes: 'Exhibition opportunity, awards',
        url: 'https://artcall.org/calls',
        source: 'ArtCall.org',
        featured: false,
        type: 'exhibition',
        openDate: '2025-10-01',
      },
      {
        id: 'annmarie-kinetic-2026',
        title: 'Movement & Rhythm Juried Exhibition',
        organization: 'Annmarie Sculpture Garden & Arts Center',
        location: 'Solomons, MD',
        deadline: '2026-01-05',
        entryFee: 25,
        description: 'Exhibition examining how artists capture, interpret, and evoke movement through visual rhythm - from fluidity of gestures to kinetic sculpture and motion-based works. Feb 13 - Apr 19, 2026.',
        mediums: ['Sculpture', 'Painting', 'Mixed Media', 'Installation'],
        theme: 'Movement, Rhythm, Kinetic Art',
        eligibility: 'US and Canada based artists, 18+',
        prizes: 'Exhibition opportunity',
        url: 'https://artist.callforentry.org/festivals.php',
        source: 'CaFÉ',
        featured: true,
        type: 'exhibition',
        openDate: '2025-09-01',
      },
      {
        id: 'curatone-jan-2026',
        title: 'Curatone.art Online Exhibition',
        organization: 'Curatone',
        location: 'Online',
        deadline: '2026-01-18',
        entryFee: null,
        description: 'Online art exhibition open to all mediums and styles.',
        mediums: ['All Mediums'],
        theme: 'Open theme',
        eligibility: 'All career stages',
        prizes: 'Online exhibition',
        url: 'https://artcall.org/calls',
        source: 'ArtCall.org',
        featured: false,
        type: 'exhibition',
        openDate: '2025-11-01',
      },
      {
        id: 'reunite-rivers-2026',
        title: 'Reunite the Rivers – Art of the Ocklawaha and Silver Springs',
        organization: 'Brick City Center for the Arts',
        location: 'Ocala, FL',
        deadline: '2026-01-25',
        entryFee: null,
        description: 'Exhibition celebrating the natural beauty of the Ocklawaha and Silver Springs. Opening February 6, 2026.',
        mediums: ['Painting', 'Photography', 'Mixed Media', 'Drawing'],
        theme: 'Nature, Rivers, Environment',
        eligibility: 'All career stages',
        prizes: 'Exhibition opportunity',
        url: 'https://artcall.org/calls',
        source: 'ArtCall.org',
        featured: false,
        type: 'exhibition',
        openDate: '2025-11-01',
      },
      {
        id: 'repreSENSATIONAL-2025',
        title: 'RepreSENSATIONAL 2025',
        organization: 'Visual Artists Alliance of St. Louis',
        location: 'St. Louis, MO / Online',
        deadline: '2025-05-15',
        entryFee: null,
        description: 'Outstanding opportunity for artists to showcase talent and gain national recognition. Exhibition August 13 - October 4, 2025.',
        mediums: ['Painting', 'Sculpture', 'Photography', 'Drawing', 'Mixed Media'],
        theme: 'Open theme',
        eligibility: 'All career stages',
        prizes: 'Over $9,000 in prizes',
        url: 'https://artist.callforentry.org/festivals_unique_info.php?ID=15153',
        source: 'CaFÉ',
        featured: true,
        type: 'exhibition',
        openDate: '2025-01-01',
      },
      {
        id: 'innovations-2025',
        title: 'INNOVATIONS 2025 - 34th Annual International Open Juried Exhibition',
        organization: 'ISEA',
        location: 'International',
        deadline: '2025-03-01',
        entryFee: null,
        description: 'One solo submission and one collaborative submission permitted per artist. AI-generated artwork not accepted.',
        mediums: ['All Mediums'],
        theme: 'Innovation',
        eligibility: 'All career stages',
        prizes: 'Exhibition, awards',
        url: 'https://artist.callforentry.org/festivals_unique_info.php?ID=15117',
        source: 'CaFÉ',
        featured: false,
        type: 'exhibition',
        openDate: '2024-12-01',
      },
      {
        id: 'cape-cod-sculpture-2026',
        title: 'Juried Outdoor Sculpture Exhibition',
        organization: 'Cape Cod Museum of Art & New England Sculptors Association',
        location: 'Dennis, MA',
        deadline: '2026-02-01',
        entryFee: null,
        description: 'Third joint Juried Sculpture Exhibition on the 22-acre campus, April 16 - November 14, 2026. Awards and stipend for installation.',
        mediums: ['Sculpture', 'Installation'],
        theme: 'Outdoor Sculpture',
        eligibility: '3D artists',
        prizes: 'Awards, installation stipend',
        url: 'https://artcall.org/calls',
        source: 'ArtCall.org',
        featured: true,
        type: 'exhibition',
        openDate: '2025-10-01',
      },
      {
        id: 'wiregrass-biennial-2026',
        title: 'B26: Wiregrass Biennial',
        organization: 'Wiregrass Museum of Art',
        location: 'Dothan, AL',
        deadline: '2026-03-01',
        entryFee: null,
        description: 'Celebrating the depth and diversity of contemporary art in the South. Exhibition July 18 - September 19, 2026.',
        mediums: ['Painting', 'Sculpture', 'Photography', 'Mixed Media', 'Video'],
        theme: 'Contemporary Southern Art',
        eligibility: 'Southeast artists',
        prizes: 'Exhibition, catalog inclusion',
        url: 'https://artcall.org/calls',
        source: 'ArtCall.org',
        featured: false,
        type: 'exhibition',
        openDate: '2025-09-01',
      },
      {
        id: 'cica-landscape-2026',
        title: 'Contemporary Landscape 2026',
        organization: 'CICA Museum',
        location: 'International',
        deadline: '2025-03-21',
        entryFee: null,
        description: 'International exhibition open to photography, 2D digital art, video art, interactive art, painting, sculpture and installation.',
        mediums: ['Photography', 'Digital Art', 'Video', 'Painting', 'Sculpture', 'Installation'],
        theme: 'Contemporary Landscape',
        eligibility: 'International artists',
        prizes: 'Museum exhibition',
        url: 'https://artenda.net/art-open-call-opportunity/exhibition',
        source: 'Artenda',
        featured: true,
        type: 'exhibition',
        openDate: '2025-01-01',
      },
      {
        id: 'booooooom-photo-2026',
        title: '2025 Booooooom Photo Awards',
        organization: 'Booooooom',
        location: 'International',
        deadline: '2026-01-09',
        entryFee: null,
        description: 'International photography competition for photographers of all levels to gain recognition and win prizes.',
        mediums: ['Photography'],
        theme: 'Open theme',
        eligibility: 'All career stages',
        prizes: 'International recognition, prizes',
        url: 'https://www.booooooom.com/open-calls/',
        source: 'Booooooom',
        featured: true,
        type: 'exhibition',
        openDate: '2025-09-01',
      },
      {
        id: 'handmade-photobook-2025',
        title: 'Handmade Photobook Exhibition 2025',
        organization: 'The Center for Fine Art Photography',
        location: 'Fort Collins, CO',
        deadline: '2025-04-27',
        entryFee: null,
        description: 'First year for handmade photobooks exhibition. Requires hand of artist in manufacture and production. Exhibition July 1 - September 28, 2025.',
        mediums: ['Photography', 'Mixed Media', 'Printmaking'],
        theme: 'Handmade Photobooks',
        eligibility: 'All career stages',
        prizes: 'Exhibition opportunity',
        url: 'https://artist.callforentry.org/festivals_unique_info.php?ID=15048',
        source: 'CaFÉ',
        featured: false,
        type: 'exhibition',
        openDate: '2025-03-21',
      },

      // === RESIDENCIES ===
      {
        id: 'anderson-ranch-2026',
        title: 'Anderson Ranch Artists-in-Residence Program',
        organization: 'Anderson Ranch Arts Center',
        location: 'Snowmass Village, CO',
        deadline: '2026-02-18',
        entryFee: 0,
        description: 'Fall and Spring residency sessions with housing, studio space and meals provided. Ceramics, new media, photography, furniture design, woodworking, painting, drawing, printmaking and sculpture.',
        mediums: ['Ceramics', 'Photography', 'Painting', 'Drawing', 'Printmaking', 'Sculpture', 'Wood', 'Digital Art'],
        theme: 'Open theme',
        eligibility: 'All career stages',
        prizes: 'Housing, studio space, meals',
        url: 'https://www.andersonranch.org/programs/artists-in-residence-program/',
        source: 'Anderson Ranch',
        featured: true,
        type: 'residency',
        openDate: '2025-12-15',
      },
      {
        id: 'yaddo-residency-2025',
        title: 'Yaddo Artist Residency',
        organization: 'Yaddo',
        location: 'Saratoga Springs, NY',
        deadline: '2025-08-01',
        entryFee: 0,
        description: 'Residencies for professional creative artists from all nations. 2 weeks to 2 months. Choreography, film, literature, musical composition, painting, performance, photography, printmaking, sculpture, video.',
        mediums: ['Painting', 'Photography', 'Printmaking', 'Sculpture', 'Video', 'Performance'],
        theme: 'Open theme',
        eligibility: 'Professional creative artists, all nations',
        prizes: 'Room, board, studio for 2 weeks to 2 months',
        url: 'https://yaddo.org/apply/',
        source: 'Yaddo',
        featured: true,
        type: 'residency',
        openDate: '2025-01-01',
      },
      {
        id: 'ucross-residency-2025',
        title: 'Ucross Foundation Residency',
        organization: 'Ucross Foundation',
        location: 'Clearmont, WY',
        deadline: '2025-10-01',
        entryFee: 0,
        description: 'Residency program on 20,000-acre ranch offering time, space, and uninterrupted creative time.',
        mediums: ['All Mediums'],
        theme: 'Open theme',
        eligibility: 'All career stages',
        prizes: 'Housing, studio, meals',
        url: 'https://www.ucrossfoundation.org/residency-program.html',
        source: 'Ucross',
        featured: true,
        type: 'residency',
        openDate: '2025-03-01',
      },
      {
        id: 'vermont-studio-2025',
        title: 'Vermont Studio Center Residency',
        organization: 'Vermont Studio Center',
        location: 'Johnson, VT',
        deadline: '2025-09-30',
        entryFee: null,
        description: 'Residencies for writers and artists. Second application period August 15 - September 30, 2025.',
        mediums: ['All Mediums'],
        theme: 'Open theme',
        eligibility: 'Writers and visual artists',
        prizes: 'Residency in Vermont',
        url: 'https://vermontstudiocenter.org',
        source: 'Vermont Studio Center',
        featured: false,
        type: 'residency',
        openDate: '2025-08-15',
      },
      {
        id: 'gallim-moving-2025',
        title: 'GALLIM Moving Artist Residency',
        organization: 'GALLIM',
        location: 'New York, NY',
        deadline: '2025-05-01',
        entryFee: 0,
        description: 'Process-based NYC studio residency for six early career BIPOC movement artists who are women, non-binary, transgender and gender nonconforming.',
        mediums: ['Performance', 'Video', 'Installation'],
        theme: 'Movement, Dance',
        eligibility: 'Early career BIPOC movement artists in NYC',
        prizes: 'Studio residency',
        url: 'https://www.gallim.org/movingartist-2025',
        source: 'GALLIM',
        featured: true,
        type: 'residency',
        openDate: '2025-01-01',
      },
      {
        id: 'wassaic-residency-2025',
        title: 'Wassaic Project Residency',
        organization: 'Wassaic Project',
        location: 'Wassaic, NY',
        deadline: '2025-06-01',
        entryFee: null,
        description: 'Artist residency, exhibitions, and fellowships in the Hudson Valley.',
        mediums: ['All Mediums'],
        theme: 'Open theme',
        eligibility: 'All career stages',
        prizes: 'Housing, studio space',
        url: 'https://www.wassaicproject.org/apply',
        source: 'Wassaic Project',
        featured: false,
        type: 'residency',
        openDate: '2025-02-01',
      },
      {
        id: 'montana-residency-2026',
        title: 'Montana Artist Residencies 2026',
        organization: 'Various Montana Programs',
        location: 'Montana',
        deadline: '2026-03-01',
        entryFee: null,
        description: 'Place-based, immersive artist residencies connecting art, community, and Montana\'s diverse landscapes. Summer, Fall 2026 and Spring 2027 sessions.',
        mediums: ['All Mediums'],
        theme: 'Place-based, Landscape',
        eligibility: 'All career stages',
        prizes: 'Residency, community engagement',
        url: 'https://artistcommunities.org/directory/open-calls',
        source: 'Artist Communities Alliance',
        featured: false,
        type: 'residency',
        openDate: '2025-10-01',
      },
      {
        id: 'quinlan-residency-2025',
        title: 'Al & Mickey Quinlan Artist Residency',
        organization: 'Miller Art Museum',
        location: 'Midwest',
        deadline: '2025-04-07',
        entryFee: 0,
        description: 'Emerging and mid-career artists working in drawing, painting, printmaking, and photography. August 4 - September 28.',
        mediums: ['Drawing', 'Painting', 'Printmaking', 'Photography'],
        theme: 'Open theme',
        eligibility: 'Emerging and mid-career artists',
        prizes: 'Residency, exhibition opportunity',
        url: 'https://www.thisiscolossal.com/2025/04/april-2025-opportunities/',
        source: 'Colossal',
        featured: false,
        type: 'residency',
        openDate: '2025-01-01',
      },
      {
        id: 'koda-social-practice-2025',
        title: 'KODA Social Practice Residency',
        organization: 'KODA',
        location: 'International',
        deadline: '2025-06-01',
        entryFee: 0,
        description: 'Open to mid-career women and/or non-binary artists. $1,000 honorarium, studio space, optional exhibition. Theme: Peace-building.',
        mediums: ['All Mediums'],
        theme: 'Peace-building, Social Practice',
        eligibility: 'Mid-career women and non-binary artists',
        prizes: '$1,000 honorarium, studio, exhibition',
        url: 'https://www.thisiscolossal.com/',
        source: 'Colossal',
        featured: true,
        type: 'residency',
        openDate: '2025-01-01',
      },

      // === GRANTS ===
      {
        id: 'creative-capital-2025',
        title: 'Creative Capital Award',
        organization: 'Creative Capital',
        location: 'National',
        deadline: '2025-09-01',
        entryFee: 0,
        description: 'The only national open call grant program for artists creating new work. Up to $50,000 unrestricted project grants plus professional development services.',
        mediums: ['All Mediums'],
        theme: 'Innovative, groundbreaking new works',
        eligibility: 'All career stages',
        prizes: 'Up to $50,000 unrestricted grant, professional development',
        url: 'https://creative-capital.org/about-the-creative-capital-award/',
        source: 'Creative Capital',
        featured: true,
        type: 'grant',
        openDate: '2025-06-01',
      },
      {
        id: 'harpo-foundation-2025',
        title: 'Harpo Foundation Grants for Visual Artists',
        organization: 'Harpo Foundation',
        location: 'National',
        deadline: '2025-04-28',
        entryFee: 15,
        description: 'Awards up to $10,000 to support development of artists\' work. Grantee may use award to support any activity toward artistic development.',
        mediums: ['All Mediums'],
        theme: 'Open theme',
        eligibility: 'All career stages',
        prizes: 'Up to $10,000',
        url: 'https://www.harpofoundation.org/grants/grants-for-visual-artists/',
        source: 'Harpo Foundation',
        featured: true,
        type: 'grant',
        openDate: '2025-01-01',
      },
      {
        id: 'nysca-nyfa-fellowship-2025',
        title: 'NYSCA/NYFA Artist Fellowship',
        organization: 'NYFA',
        location: 'New York State',
        deadline: '2025-05-15',
        entryFee: 0,
        description: '$8,000 unrestricted cash grant for artists in NY State. 2026 cycle: Craft/Sculpture, Digital/Electronic Arts, Nonfiction Literature, Poetry, Printmaking/Drawing/Book Arts.',
        mediums: ['Sculpture', 'Digital Art', 'Printmaking', 'Drawing'],
        theme: 'Open theme',
        eligibility: 'NY State residents, 25+, not in degree program',
        prizes: '$8,000 unrestricted',
        url: 'https://www.nyfa.org/awards-grants/nysca-nyfa-artist-fellowship/',
        source: 'NYFA',
        featured: true,
        type: 'fellowship',
        openDate: '2025-02-01',
      },
      {
        id: 'artadia-houston-2025',
        title: 'Artadia Awards - Houston',
        organization: 'Artadia',
        location: 'Houston, TX',
        deadline: '2025-11-01',
        entryFee: 0,
        description: '$15,000 unrestricted awards for contemporary visual artists. Los Angeles cycle includes $25,000 award.',
        mediums: ['All Mediums'],
        theme: 'Contemporary visual arts',
        eligibility: 'Houston-based artists',
        prizes: '$15,000-$25,000 unrestricted',
        url: 'https://www.artworkarchive.com/call-for-entry/complete-guide-to-2025-artist-grants-opportunities',
        source: 'Artwork Archive',
        featured: true,
        type: 'grant',
        openDate: '2025-08-01',
      },
      {
        id: 'gottlieb-foundation-2025',
        title: 'Gottlieb Foundation Individual Support Grant',
        organization: 'Gottlieb Foundation',
        location: 'National',
        deadline: '2025-12-15',
        entryFee: 0,
        description: 'For painters, sculptors, and printmakers who have worked in a mature phase of art for 20 years or more. $25,000 award.',
        mediums: ['Painting', 'Sculpture', 'Printmaking'],
        theme: 'Open theme',
        eligibility: 'Established artists (20+ years)',
        prizes: '$25,000',
        url: 'https://www.gottliebfoundation.org',
        source: 'Gottlieb Foundation',
        featured: true,
        type: 'grant',
        openDate: '2025-09-01',
      },
      {
        id: 'innovate-grant-2025',
        title: 'Innovate Grant - Fall 2025',
        organization: 'Innovate Grant',
        location: 'International',
        deadline: '2025-12-31',
        entryFee: null,
        description: 'Quarterly grants of $1,800 each awarded to one Artist and one Photographer.',
        mediums: ['All Mediums', 'Photography'],
        theme: 'Open theme',
        eligibility: 'All career stages',
        prizes: '$1,800 grant',
        url: 'https://www.artworkarchive.com/call-for-entry',
        source: 'Artwork Archive',
        featured: false,
        type: 'grant',
        openDate: '2025-10-01',
      },
      {
        id: 'south-arts-2025',
        title: 'South Arts Artist Creative Practice Grants',
        organization: 'South Arts',
        location: 'Southeast US',
        deadline: '2025-09-01',
        entryFee: 0,
        description: 'Up to $3,000 for professional development opportunities and milestone activities leading to career growth. Nov 2025 - June 2026.',
        mediums: ['All Mediums'],
        theme: 'Professional development',
        eligibility: 'Southeast US artists',
        prizes: 'Up to $3,000',
        url: 'https://www.southarts.org',
        source: 'South Arts',
        featured: false,
        type: 'grant',
        openDate: '2025-06-01',
      },
      {
        id: 'catchlight-fellowship-2025',
        title: 'CatchLight Global Fellowship',
        organization: 'CatchLight',
        location: 'International',
        deadline: '2025-12-15',
        entryFee: 0,
        description: '$30,000 grants to three innovative visual storytellers whose work serves as tool for information, connection, and transformation.',
        mediums: ['Photography', 'Video', 'Documentary'],
        theme: 'Visual storytelling, social impact',
        eligibility: 'Visual storytellers',
        prizes: '$30,000 grant',
        url: 'https://catchlight.io',
        source: 'CatchLight',
        featured: true,
        type: 'fellowship',
        openDate: '2025-09-01',
      },
      {
        id: 'kentucky-emerging-2025',
        title: 'Kentucky Emerging Artist Award',
        organization: 'Kentucky Arts Council',
        location: 'Kentucky',
        deadline: '2025-03-15',
        entryFee: 0,
        description: '$1,000 unrestricted cash award for working professional Kentucky artists in early years of career (first 10 years).',
        mediums: ['All Mediums'],
        theme: 'Open theme',
        eligibility: 'Kentucky artists, early career (10 years)',
        prizes: '$1,000 unrestricted',
        url: 'https://artscouncil.ky.gov/program/individual-artist-fellowship-and-emerging-artist-award/',
        source: 'Kentucky Arts Council',
        featured: false,
        type: 'grant',
        openDate: '2025-01-01',
      },
      {
        id: 'supporting-act-2025',
        title: 'Supporting Act Foundation Artist Grants',
        organization: 'WeTransfer / Supporting Act Foundation',
        location: 'Europe',
        deadline: '2025-10-13',
        entryFee: 0,
        description: '€10,000 unrestricted grants for emerging artists from underrepresented groups. Collaborative, collective, or community-benefiting practices.',
        mediums: ['All Mediums'],
        theme: 'Community, collaboration',
        eligibility: 'European emerging artists, underrepresented groups',
        prizes: '€10,000 unrestricted',
        url: 'https://hyperallergic.com/1046127/opportunities-october-2025/',
        source: 'Hyperallergic',
        featured: true,
        type: 'grant',
        openDate: '2025-08-01',
      },
      {
        id: 'cherryarts-emerging-2025',
        title: 'CherryArts Emerging Artist Program',
        organization: 'CherryArts',
        location: 'Denver, CO',
        deadline: '2025-03-01',
        entryFee: null,
        description: '$5,000 grant, reduced booth fee ($350), provided tent, workshops, mentoring, and lodging support for Cherry Creek Arts Festival.',
        mediums: ['All Mediums'],
        theme: 'Open theme',
        eligibility: 'Emerging artists with limited exhibition experience',
        prizes: '$5,000 grant, booth, tent, mentoring',
        url: 'https://blog.fracturedatlas.org/grants-opportunities-january-2025',
        source: 'Fractured Atlas',
        featured: true,
        type: 'grant',
        openDate: '2024-12-01',
      },
      {
        id: 'spector-craft-2025',
        title: 'Spector Craft Prize for Emerging Artists',
        organization: 'Center for Craft',
        location: 'National',
        deadline: '2025-05-01',
        entryFee: 0,
        description: '$10,000 award for five early-career artists (7 years or less). Disciplines: ceramics, textiles, woodworking, glass, metalwork, basketry, paper arts.',
        mediums: ['Ceramics', 'Textile', 'Wood', 'Glass', 'Metal'],
        theme: 'Craft',
        eligibility: 'Early-career craft artists (7 years or less)',
        prizes: '$10,000, mentorship, conference, networking',
        url: 'https://www.thisiscolossal.com/',
        source: 'Colossal',
        featured: true,
        type: 'grant',
        openDate: '2025-01-01',
      },
      {
        id: 'bader-simon-2025',
        title: 'Bader + Simon Empowerment Grant',
        organization: 'Bader + Simon Foundation',
        location: 'USA',
        deadline: '2025-06-01',
        entryFee: 0,
        description: '$7,500 stipend for US-based individuals and emerging artists without higher education and extensive exhibition experience.',
        mediums: ['All Mediums'],
        theme: 'Open theme',
        eligibility: 'US emerging artists without higher education/extensive exhibition',
        prizes: '$7,500',
        url: 'https://blog.fracturedatlas.org/',
        source: 'Fractured Atlas',
        featured: false,
        type: 'grant',
        openDate: '2025-03-01',
      },
      {
        id: 'luminarts-fellowship-2025',
        title: 'Luminarts Fellowship',
        organization: 'Luminarts Cultural Foundation',
        location: 'Chicago, IL',
        deadline: '2025-04-01',
        entryFee: 0,
        description: '$10,000 fellowship ($15,000 for voice musicians). Programs in visual arts, creative writing, classical music, and jazz.',
        mediums: ['All Mediums'],
        theme: 'Open theme',
        eligibility: 'Emerging artists',
        prizes: '$10,000-$15,000',
        url: 'https://www.luminarts.org',
        source: 'Luminarts',
        featured: true,
        type: 'fellowship',
        openDate: '2025-01-01',
      },
      {
        id: 'biafarin-awards-2025',
        title: 'Biafarin Awards - 5th Annual Juried Edition',
        organization: 'Biafarin',
        location: 'International',
        deadline: '2025-05-01',
        entryFee: null,
        description: '$4,000 CAD in cash grants plus over $6,000 CAD in additional prizes. Group and solo exhibitions, magazine publications, features on Artsy.',
        mediums: ['All Mediums'],
        theme: 'Open theme',
        eligibility: 'All career stages, international',
        prizes: '$4,000+ CAD, exhibitions, Artsy feature',
        url: 'https://www.thisiscolossal.com/',
        source: 'Colossal',
        featured: false,
        type: 'grant',
        openDate: '2025-01-01',
      },

      // === COMMISSIONS (Public Art) ===
      {
        id: 'beam-center-2025',
        title: 'Beam Center Public Artwork Project',
        organization: 'Beam Center',
        location: 'Strafford, NH',
        deadline: '2025-12-29',
        entryFee: 0,
        description: 'Design proposals for public artwork realized by 100+ young people at Beam Camp. $5,000 award with ~$15,000 fabrication budget. 3D, sculpture, wood, metal, ceramic, textile, glass, plastic, paper.',
        mediums: ['Sculpture', 'Wood', 'Metal', 'Ceramics', 'Textile', 'Glass', 'Mixed Media'],
        theme: 'Community, youth collaboration',
        eligibility: 'All career stages',
        prizes: '$5,000 award, $15,000 fabrication budget',
        url: 'https://artcall.org/calls',
        source: 'ArtCall.org',
        featured: true,
        type: 'commission',
        openDate: '2025-09-01',
      },
      {
        id: 'jefferson-plaza-2025',
        title: 'Jefferson Community College Public Art',
        organization: 'Jefferson Community and Technical College',
        location: 'Louisville, KY',
        deadline: '2025-11-30',
        entryFee: 0,
        description: 'Major work of public art for new plaza emphasizing "community" theme. Budget: $400,000.',
        mediums: ['Sculpture', 'Installation', 'Mixed Media'],
        theme: 'Community',
        eligibility: 'All career stages',
        prizes: '$400,000 budget',
        url: 'https://www.americansforthearts.org/by-program/networks-and-councils/public-art-network/opportunities',
        source: 'Americans for the Arts',
        featured: true,
        type: 'commission',
        openDate: '2025-09-01',
      },
      {
        id: 'pompano-mural-2025',
        title: 'City of Pompano Beach Mural',
        organization: 'City of Pompano Beach',
        location: 'Pompano Beach, FL',
        deadline: '2025-11-26',
        entryFee: 0,
        description: 'Commission for exterior mural with abstract and non-representational theme. Budget: $37,000.',
        mediums: ['Painting', 'Mural'],
        theme: 'Abstract, Non-representational',
        eligibility: 'All career stages',
        prizes: '$37,000',
        url: 'https://www.americansforthearts.org/',
        source: 'Americans for the Arts',
        featured: false,
        type: 'commission',
        openDate: '2025-09-01',
      },
      {
        id: 'raleigh-convention-2025',
        title: 'Raleigh Convention Center Expansion - Interactive Public Art',
        organization: 'City of Raleigh',
        location: 'Raleigh, NC',
        deadline: '2026-02-01',
        entryFee: 0,
        description: 'Permanent, outdoor, interactive artwork encouraging playful interaction. Budget up to $500,000.',
        mediums: ['Sculpture', 'Installation', 'Interactive'],
        theme: 'Interactive, playful',
        eligibility: 'All career stages',
        prizes: 'Up to $500,000',
        url: 'https://raleighnc.gov/arts/services/artist-calls',
        source: 'City of Raleigh',
        featured: true,
        type: 'commission',
        openDate: '2025-10-01',
      },
      {
        id: 'bellingham-public-art-2025',
        title: 'City of Bellingham Capital Projects Art',
        organization: 'City of Bellingham',
        location: 'Bellingham, WA',
        deadline: '2025-12-31',
        entryFee: 0,
        description: 'Artwork for capital projects with budgets ranging from $50,000 – $195,000.',
        mediums: ['Sculpture', 'Installation', 'Mixed Media'],
        theme: 'Public art',
        eligibility: 'All career stages',
        prizes: '$50,000 - $195,000',
        url: 'https://www.americansforthearts.org/',
        source: 'Americans for the Arts',
        featured: false,
        type: 'commission',
        openDate: '2025-06-01',
      },
      {
        id: 'emerge-lincoln-2025',
        title: 'EMERGE 2025 Public Art - UNI Place Creative District',
        organization: 'LUX Center for the Arts',
        location: 'Lincoln, NE',
        deadline: '2025-04-01',
        entryFee: 0,
        description: 'Three artists selected for murals in UNI Place Creative District. $4,000 compensation plus design honorarium. Theme: Past, Present and Future.',
        mediums: ['Painting', 'Mural'],
        theme: 'Creative District history and future',
        eligibility: 'All career stages',
        prizes: '$4,000 plus design honorarium',
        url: 'https://www.luxcenter.org/emerge-2025-public-art-artist-application',
        source: 'LUX Center for the Arts',
        featured: false,
        type: 'commission',
        openDate: '2025-01-01',
      },
      {
        id: 'raleigh-escooter-2025',
        title: 'Raleigh E-Scooter/E-Bike Corral Artwork',
        organization: 'City of Raleigh',
        location: 'Raleigh, NC',
        deadline: '2025-05-01',
        entryFee: 0,
        description: 'Seven artists to design and paint artwork for e-scooter and e-bike corrals through downtown Raleigh. 9-11 corral artworks per artist.',
        mediums: ['Painting', 'Illustration'],
        theme: 'Urban, transportation',
        eligibility: 'All career stages',
        prizes: 'Commission payment',
        url: 'https://raleighnc.gov/arts/services/artist-calls',
        source: 'City of Raleigh',
        featured: false,
        type: 'commission',
        openDate: '2025-02-01',
      },
      {
        id: 'moab-dark-sky-2026',
        title: 'Moab City Dark Sky Mural',
        organization: 'City of Moab',
        location: 'Moab, UT',
        deadline: '2026-01-15',
        entryFee: 0,
        description: 'Design for Dark Sky Mural to be installed in the City of Moab, celebrating dark sky preservation.',
        mediums: ['Painting', 'Mural'],
        theme: 'Dark Sky, Astronomy, Nature',
        eligibility: 'All career stages',
        prizes: 'Commission payment',
        url: 'https://artsandmuseums.utah.gov/public-art-opportunities/',
        source: 'Utah Arts & Museums',
        featured: false,
        type: 'commission',
        openDate: '2025-09-01',
      },
      {
        id: 'now-art-mural-2025',
        title: 'NOW Art Community Mural Program',
        organization: 'NOW Art',
        location: 'USA / Puerto Rico',
        deadline: '2025-12-31',
        entryFee: 0,
        description: 'Pre-qualified directory of artists for mural commissions. Contemporary, street art, and traditional styles. Up to $1,000 per project.',
        mediums: ['Painting', 'Mural'],
        theme: 'Community murals',
        eligibility: 'US and Puerto Rico residents',
        prizes: 'Up to $1,000 per project',
        url: 'https://forecastpublicart.org/consulting/artist-support/artist-opportunities/',
        source: 'Forecast Public Art',
        featured: false,
        type: 'commission',
        openDate: '2025-01-01',
      },
    ]
  }, [])

  // Load curated calls with filtering for expired deadlines
  const fetchOpenCalls = useCallback(async () => {
    setLoading(true)

    // Simulate brief loading for UX
    await new Promise(resolve => setTimeout(resolve, 300))

    const curatedCalls = getCuratedOpenCalls()

    // Filter out expired calls
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const activeCalls = curatedCalls.filter(call => {
      if (!call.deadline) return true
      const deadline = new Date(call.deadline)
      return deadline >= today
    })

    // Sort by deadline (closest first), then by featured
    activeCalls.sort((a, b) => {
      // Featured calls get priority
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1

      // Then by deadline
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline) - new Date(b.deadline)
    })

    setOpenCalls(activeCalls)
    setLastFetched(new Date().toISOString())
    setLoading(false)

    // Cache the fetched calls
    try {
      localStorage.setItem(FETCHED_CALLS_KEY, JSON.stringify(activeCalls))
      localStorage.setItem(LAST_FETCH_KEY, new Date().toISOString())
    } catch (e) {
      console.warn('Could not cache fetched calls:', e)
    }
  }, [getCuratedOpenCalls])

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

/**
 * Open Calls Web Scraper Service
 *
 * This module provides utilities for scraping art opportunities from various sources.
 *
 * IMPORTANT: Web scraping may be subject to terms of service of target websites.
 * Please use responsibly and check each site's robots.txt and ToS.
 * Consider reaching out to platforms for API access or partnership.
 *
 * Usage (run in Node.js environment or via a backend service):
 *
 * Option 1: Run as a standalone script with Node.js
 * - Install dependencies: npm install cheerio node-fetch
 * - Run: node src/services/openCallsScraper.js
 *
 * Option 2: Set up as a serverless function (Vercel, Netlify, etc.)
 * - Deploy the fetchAllSources function as an API endpoint
 * - Call from the app to refresh data
 *
 * Option 3: Use a proxy service like ScrapingBee or Browserless
 * - These services handle rate limiting and browser rendering
 */

// Logger utility for consistent formatting
const Logger = {
  colors: {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
  },

  timestamp() {
    return new Date().toISOString().split('T')[1].slice(0, 12)
  },

  info(message, data = null) {
    const prefix = `${this.colors.dim}[${this.timestamp()}]${this.colors.reset} ${this.colors.blue}INFO${this.colors.reset}`
    console.log(`${prefix} ${message}`)
    if (data) console.log(`  ${this.colors.dim}→${this.colors.reset}`, data)
  },

  success(message, data = null) {
    const prefix = `${this.colors.dim}[${this.timestamp()}]${this.colors.reset} ${this.colors.green}SUCCESS${this.colors.reset}`
    console.log(`${prefix} ${message}`)
    if (data) console.log(`  ${this.colors.dim}→${this.colors.reset}`, data)
  },

  warn(message, data = null) {
    const prefix = `${this.colors.dim}[${this.timestamp()}]${this.colors.reset} ${this.colors.yellow}WARN${this.colors.reset}`
    console.log(`${prefix} ${message}`)
    if (data) console.log(`  ${this.colors.dim}→${this.colors.reset}`, data)
  },

  error(message, error = null) {
    const prefix = `${this.colors.dim}[${this.timestamp()}]${this.colors.reset} ${this.colors.red}ERROR${this.colors.reset}`
    console.log(`${prefix} ${message}`)
    if (error) console.log(`  ${this.colors.dim}→${this.colors.reset}`, error.message || error)
  },

  debug(message, data = null) {
    const prefix = `${this.colors.dim}[${this.timestamp()}]${this.colors.reset} ${this.colors.magenta}DEBUG${this.colors.reset}`
    console.log(`${prefix} ${message}`)
    if (data) console.log(`  ${this.colors.dim}→${this.colors.reset}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data)
  },

  source(name, message) {
    const prefix = `${this.colors.dim}[${this.timestamp()}]${this.colors.reset} ${this.colors.cyan}[${name}]${this.colors.reset}`
    console.log(`${prefix} ${message}`)
  },

  divider(title = '') {
    const line = '─'.repeat(50)
    if (title) {
      console.log(`\n${this.colors.dim}──── ${this.colors.bright}${title} ${this.colors.dim}${line.slice(title.length + 6)}${this.colors.reset}`)
    } else {
      console.log(`${this.colors.dim}${line}${this.colors.reset}`)
    }
  },

  table(data, columns) {
    if (!data || data.length === 0) {
      console.log(`  ${this.colors.dim}(no data)${this.colors.reset}`)
      return
    }
    console.table(data.map(item => {
      const row = {}
      columns.forEach(col => {
        row[col] = item[col] || '-'
      })
      return row
    }))
  },
}

// Data source configurations
export const SCRAPING_SOURCES = {
  NYFA: {
    name: 'NYFA',
    baseUrl: 'https://www.nyfa.org/opportunities/',
    searchUrl: 'https://www.nyfa.org/opportunities/?keyword=&discipline=&type=&deadline=&location=',
    selectors: {
      listings: '.opportunity-card',
      title: '.opportunity-title',
      organization: '.opportunity-org',
      deadline: '.opportunity-deadline',
      type: '.opportunity-type',
      link: 'a[href]',
    },
    rateLimit: 2000, // ms between requests
  },
  CAFE: {
    name: 'CaFÉ',
    baseUrl: 'https://artist.callforentry.org/festivals.php',
    searchUrl: 'https://artist.callforentry.org/festivals.php?apply=yes',
    selectors: {
      listings: '.festival-row',
      title: '.festival-name',
      organization: '.festival-org',
      deadline: '.festival-deadline',
      type: '.festival-type',
      link: 'a[href]',
    },
    rateLimit: 3000,
  },
  ARTWORK_ARCHIVE: {
    name: 'Artwork Archive',
    baseUrl: 'https://www.artworkarchive.com/call-for-entry',
    searchUrl: 'https://www.artworkarchive.com/call-for-entry',
    selectors: {
      listings: '.call-entry-card',
      title: '.call-title',
      deadline: '.call-deadline',
      type: '.call-type',
      link: 'a[href]',
    },
    rateLimit: 2000,
  },
  ARTCALL: {
    name: 'ArtCall.org',
    baseUrl: 'https://artcall.org/calls',
    searchUrl: 'https://artcall.org/calls',
    selectors: {
      listings: '.call-item',
      title: '.call-title',
      deadline: '.call-deadline',
      link: 'a[href]',
    },
    rateLimit: 2000,
  },
}

/**
 * Parse a date string into ISO format
 * Handles various formats: "Jan 15, 2025", "January 15", "2025-01-15", etc.
 */
export function parseDeadline(dateString, verbose = false) {
  if (!dateString) {
    if (verbose) Logger.debug('parseDeadline: empty input')
    return null
  }

  // Clean up the string
  const cleaned = dateString.trim().replace(/deadline:?\s*/i, '')
  if (verbose) Logger.debug(`parseDeadline: input="${dateString}" → cleaned="${cleaned}"`)

  // Try direct parsing
  const date = new Date(cleaned)
  if (!isNaN(date.getTime())) {
    const result = date.toISOString().split('T')[0]
    if (verbose) Logger.success(`parseDeadline: direct parse succeeded → ${result}`)
    return result
  }

  // Try common formats
  const patterns = [
    // "January 15, 2025" or "Jan 15, 2025"
    /(\w+)\s+(\d{1,2}),?\s*(\d{4})/,
    // "15 January 2025"
    /(\d{1,2})\s+(\w+)\s+(\d{4})/,
    // "01/15/2025" or "1/15/2025"
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  ]

  for (const pattern of patterns) {
    const match = cleaned.match(pattern)
    if (match) {
      const parsed = new Date(cleaned)
      if (!isNaN(parsed.getTime())) {
        const result = parsed.toISOString().split('T')[0]
        if (verbose) Logger.success(`parseDeadline: pattern match succeeded → ${result}`)
        return result
      }
    }
  }

  if (verbose) Logger.warn(`parseDeadline: could not parse "${dateString}"`)
  return null
}

/**
 * Determine opportunity type from text
 */
export function parseOpportunityType(text, verbose = false) {
  if (!text) {
    if (verbose) Logger.debug('parseOpportunityType: empty input → default "exhibition"')
    return 'exhibition'
  }
  const lower = text.toLowerCase()

  const typeMap = [
    { keywords: ['residency', 'resident'], type: 'residency' },
    { keywords: ['grant'], type: 'grant' },
    { keywords: ['fellowship'], type: 'fellowship' },
    { keywords: ['commission', 'public art'], type: 'commission' },
    { keywords: ['competition', 'award'], type: 'exhibition' },
  ]

  for (const { keywords, type } of typeMap) {
    if (keywords.some(kw => lower.includes(kw))) {
      if (verbose) Logger.debug(`parseOpportunityType: "${text.slice(0, 50)}..." → ${type} (matched: ${keywords.find(kw => lower.includes(kw))})`)
      return type
    }
  }

  if (verbose) Logger.debug(`parseOpportunityType: "${text.slice(0, 50)}..." → default "exhibition"`)
  return 'exhibition'
}

/**
 * Extract entry fee from text
 */
export function parseEntryFee(text, verbose = false) {
  if (!text) {
    if (verbose) Logger.debug('parseEntryFee: empty input')
    return null
  }
  const lower = text.toLowerCase()

  if (lower.includes('free') || lower.includes('no fee') || lower.includes('$0')) {
    if (verbose) Logger.debug(`parseEntryFee: "${text.slice(0, 30)}..." → $0 (free)`)
    return 0
  }

  const match = text.match(/\$(\d+(?:\.\d{2})?)/i)
  if (match) {
    const fee = parseFloat(match[1])
    if (verbose) Logger.debug(`parseEntryFee: "${text.slice(0, 30)}..." → $${fee}`)
    return fee
  }

  if (verbose) Logger.debug(`parseEntryFee: "${text.slice(0, 30)}..." → null (no fee found)`)
  return null
}

/**
 * Extract mediums from description text
 */
export function parseMediums(text, verbose = false) {
  if (!text) {
    if (verbose) Logger.debug('parseMediums: empty input → ["All Mediums"]')
    return ['All Mediums']
  }

  const mediumKeywords = [
    'painting', 'sculpture', 'photography', 'drawing', 'printmaking',
    'ceramics', 'video', 'installation', 'performance', 'mixed media',
    'digital', 'textile', 'fiber', 'glass', 'metal', 'wood', 'mural'
  ]

  const lower = text.toLowerCase()
  const found = mediumKeywords.filter(m => lower.includes(m))

  const result = found.length > 0
    ? found.map(m => m.charAt(0).toUpperCase() + m.slice(1))
    : ['All Mediums']

  if (verbose) Logger.debug(`parseMediums: found ${found.length} mediums → [${result.join(', ')}]`)
  return result
}

/**
 * Generate a unique ID for an opportunity
 */
export function generateOpportunityId(title, organization) {
  const slug = `${title}-${organization}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 50)
  return `scraped-${slug}-${Date.now().toString(36)}`
}

/**
 * Example scraper implementation using fetch + DOM parsing
 * Note: This requires a backend environment or proxy service
 *
 * For browser usage, you'll need to:
 * 1. Use a CORS proxy
 * 2. Deploy as a serverless function
 * 3. Use a scraping API service
 */
export async function scrapeSource(sourceConfig, fetchFn = fetch, options = {}) {
  const { verbose = true, parseHtml = null } = options
  const startTime = Date.now()

  Logger.divider(`Scraping: ${sourceConfig.name}`)
  Logger.source(sourceConfig.name, `Starting scrape...`)
  Logger.source(sourceConfig.name, `URL: ${sourceConfig.searchUrl}`)
  Logger.source(sourceConfig.name, `Rate limit: ${sourceConfig.rateLimit}ms`)

  try {
    Logger.source(sourceConfig.name, `Fetching page...`)
    const response = await fetchFn(sourceConfig.searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AtelierBot/1.0; +https://atelier.art)',
        'Accept': 'text/html',
      },
    })

    Logger.source(sourceConfig.name, `Response status: ${response.status} ${response.statusText || ''}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText || ''}`)
    }

    const html = await response.text()
    const duration = Date.now() - startTime

    Logger.source(sourceConfig.name, `Received ${(html.length / 1024).toFixed(1)} KB in ${duration}ms`)

    // Log HTML structure hints for debugging selectors
    if (verbose) {
      Logger.debug(`HTML preview (first 500 chars):`)
      console.log(`  ${html.slice(0, 500).replace(/\n/g, '\\n')}...`)

      // Check if expected selectors might exist in raw HTML
      const selectors = sourceConfig.selectors
      Logger.debug(`Selector hints in raw HTML:`)
      Object.entries(selectors).forEach(([key, selector]) => {
        const classMatch = selector.match(/\.([a-z0-9_-]+)/i)
        if (classMatch) {
          const className = classMatch[1]
          const count = (html.match(new RegExp(className, 'gi')) || []).length
          console.log(`  ${key}: "${selector}" → ${count} potential matches`)
        }
      })
    }

    // If a parser function is provided, use it
    let opportunities = []
    if (parseHtml && typeof parseHtml === 'function') {
      Logger.source(sourceConfig.name, `Parsing HTML with custom parser...`)
      opportunities = parseHtml(html, sourceConfig)
      Logger.source(sourceConfig.name, `Parser returned ${opportunities.length} opportunities`)

      if (opportunities.length > 0 && verbose) {
        Logger.success(`Sample parsed opportunity:`)
        Logger.debug('First result:', opportunities[0])
      }
    } else {
      Logger.warn(`No HTML parser provided - returning empty results`)
      Logger.info(`To implement parsing, pass a parseHtml function:`)
      console.log(`
  // Example with cheerio (Node.js):
  import * as cheerio from 'cheerio'

  const parseHtml = (html, config) => {
    const $ = cheerio.load(html)
    const results = []

    $(config.selectors.listings).each((i, el) => {
      results.push({
        title: $(el).find(config.selectors.title).text().trim(),
        deadline: $(el).find(config.selectors.deadline).text().trim(),
        // ... etc
      })
    })

    return results
  }

  await scrapeSource(config, fetch, { parseHtml })
`)
    }

    const totalDuration = Date.now() - startTime
    Logger.success(`${sourceConfig.name} completed in ${totalDuration}ms → ${opportunities.length} results`)

    return opportunities

  } catch (error) {
    const duration = Date.now() - startTime
    Logger.error(`${sourceConfig.name} failed after ${duration}ms`, error)

    // Additional debugging for common errors
    if (error.message.includes('CORS')) {
      Logger.warn(`CORS error - this scraper must run server-side or use a proxy`)
    } else if (error.message.includes('fetch')) {
      Logger.warn(`Network error - check if the URL is accessible`)
    } else if (error.message.includes('403')) {
      Logger.warn(`Access forbidden - site may be blocking scrapers`)
    } else if (error.message.includes('429')) {
      Logger.warn(`Rate limited - increase delay between requests`)
    }

    return []
  }
}

/**
 * Fetch from all configured sources
 */
export async function fetchAllSources(options = {}) {
  const { verbose = true, parseHtml = null, sources = null } = options
  const startTime = Date.now()

  Logger.divider('OPEN CALLS SCRAPER')
  Logger.info(`Starting fetch from ${Object.keys(SCRAPING_SOURCES).length} sources`)
  Logger.info(`Sources: ${Object.keys(SCRAPING_SOURCES).join(', ')}`)
  Logger.info(`Timestamp: ${new Date().toISOString()}`)

  const allOpportunities = []
  const results = {
    bySource: {},
    errors: [],
    timing: {},
  }

  const sourcesToFetch = sources
    ? Object.entries(SCRAPING_SOURCES).filter(([key]) => sources.includes(key))
    : Object.entries(SCRAPING_SOURCES)

  for (const [key, config] of sourcesToFetch) {
    const sourceStart = Date.now()
    const opportunities = await scrapeSource(config, fetch, { verbose, parseHtml })

    results.bySource[key] = opportunities.length
    results.timing[key] = Date.now() - sourceStart

    if (opportunities.length === 0) {
      results.errors.push({ source: key, reason: 'No results returned' })
    }

    allOpportunities.push(...opportunities)

    // Rate limiting between sources
    if (sourcesToFetch.indexOf([key, config]) < sourcesToFetch.length - 1) {
      Logger.info(`Waiting ${config.rateLimit}ms before next source...`)
      await new Promise(resolve => setTimeout(resolve, config.rateLimit))
    }
  }

  // Deduplicate by title similarity
  Logger.divider('Deduplication')
  Logger.info(`Total opportunities before dedup: ${allOpportunities.length}`)
  const unique = deduplicateOpportunities(allOpportunities, verbose)
  Logger.info(`Total opportunities after dedup: ${unique.length}`)
  Logger.info(`Duplicates removed: ${allOpportunities.length - unique.length}`)

  // Final summary
  const totalDuration = Date.now() - startTime
  Logger.divider('SCRAPE SUMMARY')
  Logger.info(`Total duration: ${(totalDuration / 1000).toFixed(1)}s`)
  Logger.info(`Results by source:`)
  Object.entries(results.bySource).forEach(([source, count]) => {
    const timing = results.timing[source]
    console.log(`  ${source}: ${count} opportunities (${timing}ms)`)
  })

  if (results.errors.length > 0) {
    Logger.warn(`Sources with issues:`)
    results.errors.forEach(({ source, reason }) => {
      console.log(`  ${source}: ${reason}`)
    })
  }

  Logger.success(`Fetch complete: ${unique.length} unique opportunities`)
  Logger.divider()

  return {
    opportunities: unique,
    fetchedAt: new Date().toISOString(),
    sources: Object.keys(SCRAPING_SOURCES),
    stats: {
      totalFetched: allOpportunities.length,
      uniqueCount: unique.length,
      duplicatesRemoved: allOpportunities.length - unique.length,
      bySource: results.bySource,
      timing: results.timing,
      totalDuration,
    },
  }
}

/**
 * Remove duplicate opportunities based on title similarity
 */
export function deduplicateOpportunities(opportunities, verbose = false) {
  const seen = new Map()
  const duplicates = []

  const unique = opportunities.filter(opp => {
    if (!opp.title) {
      if (verbose) Logger.warn(`Skipping opportunity with no title`)
      return false
    }
    const key = opp.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30)
    if (seen.has(key)) {
      duplicates.push({ title: opp.title, key, existingSource: seen.get(key), newSource: opp.source })
      return false
    }
    seen.set(key, opp.source || 'unknown')
    return true
  })

  if (verbose && duplicates.length > 0) {
    Logger.debug(`Duplicates found:`)
    duplicates.slice(0, 5).forEach(dup => {
      console.log(`  "${dup.title.slice(0, 40)}..." (${dup.newSource} duplicate of ${dup.existingSource})`)
    })
    if (duplicates.length > 5) {
      console.log(`  ... and ${duplicates.length - 5} more`)
    }
  }

  return unique
}

/**
 * Alternative: RSS Feed Parser
 * Some sites offer RSS feeds which are easier to parse legally
 */
export const RSS_FEEDS = {
  // Add RSS feeds here as you discover them
  // format: { name: 'Source Name', url: 'https://example.com/feed.rss' }
}

/**
 * Parse RSS/Atom feed for opportunities
 */
export async function parseRSSFeed(feedUrl, fetchFn = fetch, options = {}) {
  const { verbose = true } = options
  const startTime = Date.now()

  Logger.divider(`RSS Feed`)
  Logger.info(`Fetching: ${feedUrl}`)

  try {
    const response = await fetchFn(feedUrl)
    const xml = await response.text()
    const duration = Date.now() - startTime

    Logger.success(`Fetched RSS feed (${(xml.length / 1024).toFixed(1)} KB) in ${duration}ms`)

    if (verbose) {
      // Try to extract some basic info from the feed
      const titleMatch = xml.match(/<title>([^<]+)<\/title>/i)
      const itemCount = (xml.match(/<item>/gi) || xml.match(/<entry>/gi) || []).length

      if (titleMatch) {
        Logger.info(`Feed title: ${titleMatch[1]}`)
      }
      Logger.info(`Items found: ${itemCount}`)

      // Show preview
      Logger.debug(`XML preview (first 300 chars):`)
      console.log(`  ${xml.slice(0, 300).replace(/\n/g, '\\n')}...`)
    }

    // In a real implementation, use an XML parser
    Logger.warn(`RSS parsing not implemented - returning empty results`)
    Logger.info(`To implement, use DOMParser (browser) or xml2js (Node.js)`)

    return []
  } catch (error) {
    Logger.error(`RSS feed failed`, error)
    return []
  }
}

/**
 * Manual JSON Update Endpoint
 *
 * If you prefer to manually curate data, you can:
 * 1. Create a JSON file with opportunities
 * 2. Host it somewhere (GitHub Gist, S3, etc.)
 * 3. Fetch it in the app
 */
export const MANUAL_DATA_URL = null // Set to your hosted JSON URL

export async function fetchManualData(url = MANUAL_DATA_URL, options = {}) {
  const { verbose = true } = options

  if (!url) {
    if (verbose) Logger.warn('fetchManualData: No URL configured')
    return null
  }

  Logger.divider('Manual Data Fetch')
  Logger.info(`Fetching: ${url}`)

  try {
    const startTime = Date.now()
    const response = await fetch(url)
    const data = await response.json()
    const duration = Date.now() - startTime

    Logger.success(`Fetched manual data in ${duration}ms`)
    if (verbose) {
      Logger.info(`Data type: ${Array.isArray(data) ? 'array' : typeof data}`)
      if (Array.isArray(data)) {
        Logger.info(`Items: ${data.length}`)
        if (data.length > 0) {
          Logger.debug('Sample item:', data[0])
        }
      } else if (data.opportunities) {
        Logger.info(`Opportunities: ${data.opportunities.length}`)
      }
    }

    return data
  } catch (error) {
    Logger.error('fetchManualData failed', error)
    return null
  }
}

/**
 * Test/validate the scraper with sample data
 * Run this to verify parsing functions work correctly
 */
export function runValidation() {
  Logger.divider('SCRAPER VALIDATION')
  Logger.info('Testing parsing functions with sample data...\n')

  // Test parseDeadline
  Logger.info('Testing parseDeadline:')
  const dateTests = [
    'January 15, 2025',
    'Jan 15, 2025',
    '15 January 2025',
    '01/15/2025',
    '2025-01-15',
    'Deadline: March 1, 2025',
    'invalid date',
    '',
  ]
  dateTests.forEach(input => {
    const result = parseDeadline(input)
    console.log(`  "${input}" → ${result || '(null)'}`)
  })

  // Test parseOpportunityType
  console.log('')
  Logger.info('Testing parseOpportunityType:')
  const typeTests = [
    'Artist Residency Program',
    'Emergency Grant for Artists',
    'Fellowship Opportunity',
    'Public Art Commission',
    'Annual Art Competition',
    'Open Call for Exhibition',
    'Something else entirely',
  ]
  typeTests.forEach(input => {
    const result = parseOpportunityType(input)
    console.log(`  "${input}" → ${result}`)
  })

  // Test parseEntryFee
  console.log('')
  Logger.info('Testing parseEntryFee:')
  const feeTests = [
    'Entry fee: $35',
    'Free to apply',
    'No fee required',
    '$25 for up to 3 works',
    '$0 entry',
    'Fee varies',
  ]
  feeTests.forEach(input => {
    const result = parseEntryFee(input)
    console.log(`  "${input}" → ${result !== null ? `$${result}` : '(null)'}`)
  })

  // Test parseMediums
  console.log('')
  Logger.info('Testing parseMediums:')
  const mediumTests = [
    'Open to painting, sculpture, and photography',
    'Digital art and video installation',
    'All mediums welcome',
    'Seeking ceramic and glass artists',
    '',
  ]
  mediumTests.forEach(input => {
    const result = parseMediums(input)
    console.log(`  "${input || '(empty)'}" → [${result.join(', ')}]`)
  })

  // Test generateOpportunityId
  console.log('')
  Logger.info('Testing generateOpportunityId:')
  const id = generateOpportunityId('Amazing Art Show 2025', 'Gallery XYZ')
  console.log(`  Title: "Amazing Art Show 2025", Org: "Gallery XYZ"`)
  console.log(`  → ${id}`)

  Logger.divider('VALIDATION COMPLETE')
  Logger.success('All parsing functions executed successfully')

  return true
}

/**
 * Quick test of a single source (useful for debugging)
 */
export async function testSource(sourceName, options = {}) {
  const config = SCRAPING_SOURCES[sourceName]
  if (!config) {
    Logger.error(`Unknown source: ${sourceName}`)
    Logger.info(`Available sources: ${Object.keys(SCRAPING_SOURCES).join(', ')}`)
    return null
  }

  return await scrapeSource(config, fetch, { verbose: true, ...options })
}

// Export the Logger for external use
export { Logger }

// Export a ready-to-use scraper configuration
export default {
  sources: SCRAPING_SOURCES,
  Logger,
  parseDeadline,
  parseOpportunityType,
  parseEntryFee,
  parseMediums,
  generateOpportunityId,
  scrapeSource,
  fetchAllSources,
  deduplicateOpportunities,
  parseRSSFeed,
  fetchManualData,
  runValidation,
  testSource,
}

// ============================================================
// AUTO-RUN WHEN EXECUTED DIRECTLY
// ============================================================
// Detect if running as main module (Node.js) or in browser console
const isMainModule = typeof process !== 'undefined' &&
  process.argv &&
  process.argv[1] &&
  (process.argv[1].includes('openCallsScraper') || process.argv[1].endsWith('.js'))

const isBrowserConsole = typeof window !== 'undefined'

if (isMainModule || isBrowserConsole) {
  Logger.divider('OPEN CALLS SCRAPER - INTERACTIVE MODE')
  Logger.info('Scraper loaded! Available commands:\n')

  console.log(`
  QUICK START:
  ─────────────────────────────────────────────────
  runValidation()          - Test all parsing functions
  testSource('NYFA')       - Test scraping NYFA (or: CAFE, ARTWORK_ARCHIVE, ARTCALL)
  fetchAllSources()        - Scrape all sources (requires backend/proxy)

  PARSING FUNCTIONS (test individually):
  ─────────────────────────────────────────────────
  parseDeadline('Jan 15, 2025')
  parseOpportunityType('Artist Residency Program')
  parseEntryFee('Entry fee: $35')
  parseMediums('Open to painting and sculpture')

  CONFIGURATION:
  ─────────────────────────────────────────────────
  SCRAPING_SOURCES         - View all source configs
  Logger.info('test')      - Test the logger

  `)

  // Auto-run validation in browser console for immediate feedback
  if (isBrowserConsole) {
    Logger.info('Running validation automatically...\n')
    runValidation()
  }
}

// Also expose functions globally in browser for easy console access
if (typeof window !== 'undefined') {
  window.openCallsScraper = {
    Logger,
    SCRAPING_SOURCES,
    parseDeadline,
    parseOpportunityType,
    parseEntryFee,
    parseMediums,
    generateOpportunityId,
    scrapeSource,
    fetchAllSources,
    deduplicateOpportunities,
    runValidation,
    testSource,
  }

  Logger.success('Scraper exposed as window.openCallsScraper')
  Logger.info('Try: openCallsScraper.runValidation()')
}

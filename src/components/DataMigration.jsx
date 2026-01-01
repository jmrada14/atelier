import { useState, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from '../context/AuthContext'

// localStorage keys from the old system
const STORAGE_KEYS = {
  artworks: 'artworks',
  materials: 'artInventory',
  wishlist: 'artWishlist',
  pieces: 'atelier-pieces',
  collectors: 'atelier_collectors',
  reminders: 'atelier_reminders',
  newsletters: 'atelier_newsletters',
  openCalls: 'atelier-open-calls',
  preferences: 'atelier-artist-preferences',
  migrationComplete: 'atelier_migration_complete',
}

function DataMigration({ onComplete }) {
  const { sessionToken } = useAuth()
  const [migrationStatus, setMigrationStatus] = useState('checking') // checking, available, migrating, complete, error
  const [progress, setProgress] = useState({ current: 0, total: 0, currentType: '' })
  const [dataSummary, setDataSummary] = useState(null)
  const [error, setError] = useState(null)

  // Convex mutations for batch import
  const batchImportArtworks = useMutation(api.artworks.batchImport)
  const batchImportMaterials = useMutation(api.materials.batchImport)
  const batchImportPieces = useMutation(api.pieces.batchImport)
  const batchImportCollectors = useMutation(api.collectors.batchImport)
  const batchImportReminders = useMutation(api.reminders.batchImport)
  const batchImportNewsletters = useMutation(api.newsletters.batchImport)

  // Check for existing localStorage data on mount
  useEffect(() => {
    checkForData()
  }, [])

  const checkForData = () => {
    // Check if migration was already completed
    const migrationComplete = localStorage.getItem(STORAGE_KEYS.migrationComplete)
    if (migrationComplete === 'true') {
      setMigrationStatus('complete')
      return
    }

    // Check what data exists
    const summary = {
      artworks: parseLocalStorageData(STORAGE_KEYS.artworks),
      materials: parseLocalStorageData(STORAGE_KEYS.materials),
      wishlist: parseLocalStorageData(STORAGE_KEYS.wishlist),
      pieces: parseLocalStorageData(STORAGE_KEYS.pieces),
      collectors: parseLocalStorageData(STORAGE_KEYS.collectors),
      reminders: parseLocalStorageData(STORAGE_KEYS.reminders),
      newsletters: parseLocalStorageData(STORAGE_KEYS.newsletters),
    }

    const totalItems = Object.values(summary).reduce((sum, arr) => sum + (arr?.length || 0), 0)

    if (totalItems === 0) {
      setMigrationStatus('complete')
      localStorage.setItem(STORAGE_KEYS.migrationComplete, 'true')
      return
    }

    setDataSummary(summary)
    setMigrationStatus('available')
  }

  const parseLocalStorageData = (key) => {
    try {
      const data = localStorage.getItem(key)
      if (!data) return null
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  const startMigration = async () => {
    if (!sessionToken || !dataSummary) return

    setMigrationStatus('migrating')
    setError(null)

    try {
      const tasks = []
      let totalItems = 0

      // Count total items
      if (dataSummary.artworks?.length) totalItems += dataSummary.artworks.length
      if (dataSummary.materials?.length) totalItems += dataSummary.materials.length
      if (dataSummary.wishlist?.length) totalItems += dataSummary.wishlist.length
      if (dataSummary.pieces?.length) totalItems += dataSummary.pieces.length
      if (dataSummary.collectors?.length) totalItems += dataSummary.collectors.length
      if (dataSummary.reminders?.length) totalItems += dataSummary.reminders.length
      if (dataSummary.newsletters?.length) totalItems += dataSummary.newsletters.length

      setProgress({ current: 0, total: totalItems, currentType: '' })
      let currentProgress = 0

      // Migrate artworks
      if (dataSummary.artworks?.length) {
        setProgress(p => ({ ...p, currentType: 'Artworks' }))
        await batchImportArtworks({
          sessionToken,
          artworks: dataSummary.artworks.map(a => ({
            title: a.title || 'Untitled',
            medium: a.medium || 'Unknown',
            yearCompleted: a.yearCompleted,
            price: a.price,
            location: a.location,
            thumbnailUrl: a.thumbnailUrl,
            highResUrl: a.highResUrl,
            archived: a.archived || false,
            dimensions: a.dimensions,
            notes: a.notes,
          })),
        })
        currentProgress += dataSummary.artworks.length
        setProgress(p => ({ ...p, current: currentProgress }))
      }

      // Migrate materials (inventory + wishlist)
      const allMaterials = [
        ...(dataSummary.materials || []).map(m => ({ ...m, isWishlist: false })),
        ...(dataSummary.wishlist || []).map(m => ({ ...m, isWishlist: true })),
      ]
      if (allMaterials.length) {
        setProgress(p => ({ ...p, currentType: 'Materials' }))
        await batchImportMaterials({
          sessionToken,
          materials: allMaterials.map(m => ({
            name: m.name || 'Unnamed Material',
            category: m.category || 'Other',
            quantity: m.quantity || 1,
            unit: m.unit,
            location: m.location,
            notes: m.notes,
            lowStockThreshold: m.lowStockThreshold,
            isWishlist: m.isWishlist || false,
            priority: m.priority,
            estimatedPrice: m.estimatedPrice,
            link: m.link,
          })),
        })
        currentProgress += allMaterials.length
        setProgress(p => ({ ...p, current: currentProgress }))
      }

      // Migrate pieces
      if (dataSummary.pieces?.length) {
        setProgress(p => ({ ...p, currentType: 'Works in Progress' }))
        await batchImportPieces({
          sessionToken,
          pieces: dataSummary.pieces.map(p => ({
            title: p.title || 'Untitled',
            type: p.type || 'painting',
            status: p.status || 'not-started',
            deadline: p.deadline,
            estimatedHours: p.estimatedHours,
            hoursSpent: p.hoursSpent,
            materials: p.materials,
            techniques: p.techniques,
            reference: p.reference,
            commission: p.commission,
            commissionDetails: p.commissionDetails,
            notes: (p.notes || []).map(n => ({
              text: n.text || '',
              createdAt: n.createdAt,
            })),
            images: (p.images || []).map(i => ({
              url: i.url || '',
              caption: i.caption,
              createdAt: i.createdAt,
            })),
          })),
        })
        currentProgress += dataSummary.pieces.length
        setProgress(p => ({ ...p, current: currentProgress }))
      }

      // Migrate collectors
      if (dataSummary.collectors?.length) {
        setProgress(p => ({ ...p, currentType: 'Collectors' }))
        await batchImportCollectors({
          sessionToken,
          collectors: dataSummary.collectors.map(c => ({
            name: c.name || 'Unknown',
            email: c.email,
            phone: c.phone,
            category: c.category || 'lead',
            notes: c.notes,
            lastContactedAt: c.lastContactedAt,
          })),
        })
        currentProgress += dataSummary.collectors.length
        setProgress(p => ({ ...p, current: currentProgress }))
      }

      // Migrate reminders
      if (dataSummary.reminders?.length) {
        setProgress(p => ({ ...p, currentType: 'Reminders' }))
        await batchImportReminders({
          sessionToken,
          reminders: dataSummary.reminders.map(r => ({
            title: r.title || 'Reminder',
            description: r.description,
            dueDate: r.dueDate,
            completed: r.completed || false,
            collectorIds: r.collectorIds || [],
          })),
        })
        currentProgress += dataSummary.reminders.length
        setProgress(p => ({ ...p, current: currentProgress }))
      }

      // Migrate newsletters
      if (dataSummary.newsletters?.length) {
        setProgress(p => ({ ...p, currentType: 'Newsletters' }))
        await batchImportNewsletters({
          sessionToken,
          newsletters: dataSummary.newsletters.map(n => ({
            subject: n.subject || 'Newsletter',
            body: n.body || '',
            recipientIds: n.recipientIds || [],
          })),
        })
        currentProgress += dataSummary.newsletters.length
        setProgress(p => ({ ...p, current: currentProgress }))
      }

      // Mark migration as complete
      localStorage.setItem(STORAGE_KEYS.migrationComplete, 'true')
      setMigrationStatus('complete')

      // Optional: Clear old localStorage data after successful migration
      // Uncomment if you want to clean up after migration
      // clearOldData()

    } catch (err) {
      console.error('Migration failed:', err)
      setError(err.message || 'Migration failed. Please try again.')
      setMigrationStatus('error')
    }
  }

  const clearOldData = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      if (key !== STORAGE_KEYS.migrationComplete) {
        localStorage.removeItem(key)
      }
    })
  }

  const skipMigration = () => {
    localStorage.setItem(STORAGE_KEYS.migrationComplete, 'true')
    setMigrationStatus('complete')
    onComplete?.()
  }

  const handleComplete = () => {
    onComplete?.()
  }

  // Don't show anything while checking or if complete
  if (migrationStatus === 'checking') {
    return null
  }

  if (migrationStatus === 'complete') {
    return null
  }

  return (
    <div className="migration-overlay">
      <div className="migration-modal">
        <div className="migration-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        </div>

        <h2 className="migration-title">Welcome to Atelier</h2>

        {migrationStatus === 'available' && (
          <>
            <p className="migration-description">
              We found existing data from your browser. Would you like to import it into your new account?
            </p>

            <div className="migration-summary">
              <h3>Data Found:</h3>
              <ul>
                {dataSummary.artworks?.length > 0 && (
                  <li>{dataSummary.artworks.length} artwork{dataSummary.artworks.length !== 1 ? 's' : ''}</li>
                )}
                {(dataSummary.materials?.length > 0 || dataSummary.wishlist?.length > 0) && (
                  <li>
                    {(dataSummary.materials?.length || 0) + (dataSummary.wishlist?.length || 0)} material{(dataSummary.materials?.length || 0) + (dataSummary.wishlist?.length || 0) !== 1 ? 's' : ''}
                  </li>
                )}
                {dataSummary.pieces?.length > 0 && (
                  <li>{dataSummary.pieces.length} work{dataSummary.pieces.length !== 1 ? 's' : ''} in progress</li>
                )}
                {dataSummary.collectors?.length > 0 && (
                  <li>{dataSummary.collectors.length} collector{dataSummary.collectors.length !== 1 ? 's' : ''}</li>
                )}
                {dataSummary.reminders?.length > 0 && (
                  <li>{dataSummary.reminders.length} reminder{dataSummary.reminders.length !== 1 ? 's' : ''}</li>
                )}
                {dataSummary.newsletters?.length > 0 && (
                  <li>{dataSummary.newsletters.length} newsletter{dataSummary.newsletters.length !== 1 ? 's' : ''}</li>
                )}
              </ul>
            </div>

            <div className="migration-actions">
              <button className="action-btn primary" onClick={startMigration}>
                Import Data
              </button>
              <button className="action-btn" onClick={skipMigration}>
                Start Fresh
              </button>
            </div>
          </>
        )}

        {migrationStatus === 'migrating' && (
          <>
            <p className="migration-description">
              Importing your data...
            </p>

            <div className="migration-progress">
              <div className="migration-progress-bar">
                <div
                  className="migration-progress-fill"
                  style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
              <p className="migration-progress-text">
                {progress.currentType && `Importing ${progress.currentType}... `}
                {progress.current} / {progress.total}
              </p>
            </div>
          </>
        )}

        {migrationStatus === 'error' && (
          <>
            <p className="migration-description migration-error">
              {error}
            </p>

            <div className="migration-actions">
              <button className="action-btn primary" onClick={startMigration}>
                Try Again
              </button>
              <button className="action-btn" onClick={skipMigration}>
                Skip Migration
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DataMigration

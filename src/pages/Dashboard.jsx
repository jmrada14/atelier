import { useState, useMemo } from 'react'
import { usePieces } from '../hooks/usePieces'
import PieceCard from '../components/PieceCard'
import PieceModal from '../components/PieceModal'
import TimelineModal from '../components/TimelineModal'
import MoveToInventoryModal from '../components/MoveToInventoryModal'

const FILTERS = [
  { key: 'all', label: 'All Pieces' },
  { key: 'commission', label: 'Commissions' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'exploration', label: 'Exploration' },
]

function Dashboard() {
  const { pieces, addPiece, updatePiece, deletePiece, addNote, deleteNote, addImage, deleteImage } = usePieces()
  const [activeFilter, setActiveFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPiece, setEditingPiece] = useState(null)
  const [timelinePiece, setTimelinePiece] = useState(null)
  const [moveToInventoryPiece, setMoveToInventoryPiece] = useState(null)

  const filteredPieces = useMemo(() => {
    if (activeFilter === 'all') return pieces
    return pieces.filter(piece => piece.type === activeFilter)
  }, [pieces, activeFilter])

  const handleAddPiece = () => {
    setEditingPiece(null)
    setModalOpen(true)
  }

  const handleEditPiece = (piece) => {
    setEditingPiece(piece)
    setModalOpen(true)
  }

  const handleSavePiece = (pieceData) => {
    if (editingPiece) {
      updatePiece(editingPiece.id, pieceData)
    } else {
      addPiece(pieceData)
    }
    setModalOpen(false)
    setEditingPiece(null)
  }

  const handleDeletePiece = (id) => {
    if (window.confirm('Are you sure you want to delete this piece?')) {
      deletePiece(id)
    }
  }

  const handleStatusChange = (id, newStatus) => {
    updatePiece(id, { status: newStatus })
  }

  const handleMoveToInventory = (piece) => {
    setMoveToInventoryPiece(piece)
  }

  const handleConfirmMoveToInventory = (inventoryData) => {
    // Add to inventory
    const artworks = JSON.parse(localStorage.getItem('artworks') || '[]')
    const newArtwork = {
      id: Date.now(),
      title: inventoryData.title,
      medium: inventoryData.medium,
      yearCompleted: inventoryData.yearCompleted,
      price: inventoryData.price,
      location: inventoryData.location,
      thumbnailUrl: inventoryData.thumbnailUrl || 'https://picsum.photos/seed/' + Date.now() + '/300/300',
      highResUrl: inventoryData.highResUrl || inventoryData.thumbnailUrl || 'https://picsum.photos/seed/' + Date.now() + '/2000/2000',
      archived: false,
    }
    artworks.unshift(newArtwork)
    localStorage.setItem('artworks', JSON.stringify(artworks))

    // Remove from pieces
    deletePiece(moveToInventoryPiece.id)
    setMoveToInventoryPiece(null)
  }

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Works in Progress</h2>
          <p className="dashboard-subtitle">
            {pieces.length === 0
              ? 'Your studio awaits its first masterpiece'
              : `${pieces.length} piece${pieces.length !== 1 ? 's' : ''} in your collection`}
          </p>
        </div>
        <div className="filters">
          {FILTERS.map(filter => (
            <button
              key={filter.key}
              className={`filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
              data-filter={filter.key}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filteredPieces.length === 0 && pieces.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          <h3>Begin Your Journey</h3>
          <p>Add your first piece to start tracking your creative progress</p>
        </div>
      ) : filteredPieces.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <h3>No pieces found</h3>
          <p>No {FILTERS.find(f => f.key === activeFilter)?.label.toLowerCase()} in your collection yet</p>
        </div>
      ) : null}

      <div className="pieces-grid">
        {filteredPieces.map(piece => (
          <PieceCard
            key={piece.id}
            piece={piece}
            onEdit={() => handleEditPiece(piece)}
            onDelete={() => handleDeletePiece(piece.id)}
            onStatusChange={(status) => handleStatusChange(piece.id, status)}
            onAddNote={(text) => addNote(piece.id, text)}
            onDeleteNote={(noteId) => deleteNote(piece.id, noteId)}
            onAddImage={(imageData) => addImage(piece.id, imageData)}
            onDeleteImage={(imageId) => deleteImage(piece.id, imageId)}
            onViewTimeline={(piece) => setTimelinePiece(piece)}
            onMoveToInventory={handleMoveToInventory}
          />
        ))}
        <button className="add-piece-card" onClick={handleAddPiece}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Piece</span>
        </button>
      </div>

      {modalOpen && (
        <PieceModal
          piece={editingPiece}
          onSave={handleSavePiece}
          onClose={() => {
            setModalOpen(false)
            setEditingPiece(null)
          }}
        />
      )}

      {timelinePiece && (
        <TimelineModal
          piece={timelinePiece}
          onClose={() => setTimelinePiece(null)}
        />
      )}

      {moveToInventoryPiece && (
        <MoveToInventoryModal
          piece={moveToInventoryPiece}
          onConfirm={handleConfirmMoveToInventory}
          onClose={() => setMoveToInventoryPiece(null)}
        />
      )}
    </>
  )
}

export default Dashboard

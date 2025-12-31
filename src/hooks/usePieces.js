import { useState, useEffect } from 'react'

const STORAGE_KEY = 'atelier-pieces'

// Generate unique IDs
const generateId = () => `piece-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export function usePieces() {
  const [pieces, setPieces] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pieces))
  }, [pieces])

  const addPiece = (pieceData) => {
    const newPiece = {
      id: generateId(),
      title: pieceData.title,
      deadline: pieceData.deadline,
      status: pieceData.status || 'not-started',
      type: pieceData.type,
      notes: pieceData.notes || [],
      images: pieceData.images || [],
      createdAt: new Date().toISOString(),
    }
    setPieces(prev => [newPiece, ...prev])
    return newPiece
  }

  const updatePiece = (id, updates) => {
    setPieces(prev => prev.map(piece =>
      piece.id === id ? { ...piece, ...updates } : piece
    ))
  }

  const deletePiece = (id) => {
    setPieces(prev => prev.filter(piece => piece.id !== id))
  }

  const addNote = (pieceId, noteText) => {
    setPieces(prev => prev.map(piece => {
      if (piece.id === pieceId) {
        return {
          ...piece,
          notes: [...piece.notes, { id: generateId(), text: noteText, createdAt: new Date().toISOString() }]
        }
      }
      return piece
    }))
  }

  const updateNote = (pieceId, noteId, noteText) => {
    setPieces(prev => prev.map(piece => {
      if (piece.id === pieceId) {
        return {
          ...piece,
          notes: piece.notes.map(note =>
            note.id === noteId ? { ...note, text: noteText } : note
          )
        }
      }
      return piece
    }))
  }

  const deleteNote = (pieceId, noteId) => {
    setPieces(prev => prev.map(piece => {
      if (piece.id === pieceId) {
        return {
          ...piece,
          notes: piece.notes.filter(note => note.id !== noteId)
        }
      }
      return piece
    }))
  }

  const addImage = (pieceId, imageData) => {
    setPieces(prev => prev.map(piece => {
      if (piece.id === pieceId) {
        const newImage = {
          id: generateId(),
          url: imageData.url,
          caption: imageData.caption || '',
          createdAt: new Date().toISOString(),
        }
        return {
          ...piece,
          images: [...(piece.images || []), newImage]
        }
      }
      return piece
    }))
  }

  const deleteImage = (pieceId, imageId) => {
    setPieces(prev => prev.map(piece => {
      if (piece.id === pieceId) {
        return {
          ...piece,
          images: (piece.images || []).filter(img => img.id !== imageId)
        }
      }
      return piece
    }))
  }

  return {
    pieces,
    addPiece,
    updatePiece,
    deletePiece,
    addNote,
    updateNote,
    deleteNote,
    addImage,
    deleteImage,
  }
}

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from '../context/AuthContext'

export function usePieces() {
  const { sessionToken } = useAuth()

  // Convex queries and mutations
  const pieces = useQuery(
    api.pieces.list,
    sessionToken ? { sessionToken } : "skip"
  ) || []

  const createPiece = useMutation(api.pieces.create)
  const updatePieceMutation = useMutation(api.pieces.update)
  const removePiece = useMutation(api.pieces.remove)
  const addNoteMutation = useMutation(api.pieces.addNote)
  const updateNoteMutation = useMutation(api.pieces.updateNote)
  const deleteNoteMutation = useMutation(api.pieces.deleteNote)
  const addImageMutation = useMutation(api.pieces.addImage)
  const deleteImageMutation = useMutation(api.pieces.deleteImage)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)

  const addPiece = async (pieceData) => {
    try {
      const result = await createPiece({
        sessionToken,
        title: pieceData.title,
        deadline: pieceData.deadline,
        status: pieceData.status || 'not-started',
        type: pieceData.type,
      })
      return { id: result.id, ...pieceData }
    } catch (error) {
      console.error('Failed to add piece:', error)
      throw error
    }
  }

  const updatePiece = async (id, updates) => {
    try {
      await updatePieceMutation({
        sessionToken,
        id,
        ...updates,
      })
    } catch (error) {
      console.error('Failed to update piece:', error)
      throw error
    }
  }

  const deletePiece = async (id) => {
    try {
      await removePiece({
        sessionToken,
        id,
      })
    } catch (error) {
      console.error('Failed to delete piece:', error)
      throw error
    }
  }

  const addNote = async (pieceId, noteText) => {
    try {
      await addNoteMutation({
        sessionToken,
        pieceId,
        text: noteText,
      })
    } catch (error) {
      console.error('Failed to add note:', error)
      throw error
    }
  }

  const updateNote = async (pieceId, noteId, noteText) => {
    try {
      await updateNoteMutation({
        sessionToken,
        noteId,
        text: noteText,
      })
    } catch (error) {
      console.error('Failed to update note:', error)
      throw error
    }
  }

  const deleteNote = async (pieceId, noteId) => {
    try {
      await deleteNoteMutation({
        sessionToken,
        noteId,
      })
    } catch (error) {
      console.error('Failed to delete note:', error)
      throw error
    }
  }

  // Upload a file to Convex storage and add it as an image
  const uploadImage = async (pieceId, file, caption) => {
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl({ sessionToken })

      // Upload the file
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!result.ok) {
        throw new Error('Failed to upload file')
      }

      const { storageId } = await result.json()

      // Add image record with storageId
      await addImageMutation({
        sessionToken,
        pieceId,
        storageId,
        caption,
      })

      return { success: true, storageId }
    } catch (error) {
      console.error('Failed to upload image:', error)
      throw error
    }
  }

  const addImage = async (pieceId, imageData) => {
    try {
      // If it's a File object, upload it
      if (imageData.file) {
        return await uploadImage(pieceId, imageData.file, imageData.caption)
      }
      // Otherwise use URL (for external URLs)
      await addImageMutation({
        sessionToken,
        pieceId,
        url: imageData.url,
        caption: imageData.caption,
      })
    } catch (error) {
      console.error('Failed to add image:', error)
      throw error
    }
  }

  const deleteImage = async (pieceId, imageId) => {
    try {
      await deleteImageMutation({
        sessionToken,
        imageId,
      })
    } catch (error) {
      console.error('Failed to delete image:', error)
      throw error
    }
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
    uploadImage,
    deleteImage,
  }
}

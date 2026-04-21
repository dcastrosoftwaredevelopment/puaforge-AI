import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type MessageImage } from '@/atoms'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_BASE64_BYTES = 5 * 1024 * 1024
const MAX_DIMENSION = 2048

function compressImage(file: File): Promise<{ base64: string; mediaType: MessageImage['mediaType'] }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      let quality = 0.9
      let dataUrl = ''
      while (quality > 0.1) {
        dataUrl = canvas.toDataURL('image/jpeg', quality)
        const base64 = dataUrl.split(',')[1]
        if (base64.length * 0.75 <= MAX_BASE64_BYTES) {
          resolve({ base64, mediaType: 'image/jpeg' })
          return
        }
        quality -= 0.1
      }
      reject(new Error('chat.imageErrors.tooLarge'))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('chat.imageErrors.loadError')) }
    img.src = url
  })
}

function fileToMessageImage(file: File): Promise<MessageImage> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      reject(new Error('chat.imageErrors.unsupportedType'))
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      if (base64.length * 0.75 <= MAX_BASE64_BYTES) {
        resolve({ base64, mediaType: file.type as MessageImage['mediaType'] })
        return
      }
      try {
        const compressed = await compressImage(file)
        resolve(compressed)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('chat.imageErrors.readError'))
    reader.readAsDataURL(file)
  })
}

export function useImageUpload() {
  const { t } = useTranslation()
  const [pendingImages, setPendingImages] = useState<MessageImage[]>([])
  const [imageError, setImageError] = useState<string | null>(null)

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setImageError(null)
    try {
      const newImages = await Promise.all(selectedFiles.map(fileToMessageImage))
      setPendingImages((prev) => [...prev, ...newImages])
    } catch (err) {
      const key = err instanceof Error ? err.message : 'chat.imageErrors.readError'
      setImageError(t(key))
      setTimeout(() => setImageError(null), 4000)
    }
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const clearImages = () => setPendingImages([])

  return { pendingImages, imageError, handleImageSelect, removeImage, clearImages }
}

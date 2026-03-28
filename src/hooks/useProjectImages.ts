import { useCallback } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { activeProjectIdAtom, projectImagesAtom, type ProjectImage } from '@/atoms'
import { useFiles } from '@/hooks/useFiles'
import { db } from '@/services/db'

/** Converts a name like "hero-bg.jpg" to a valid JS export name like "heroBg" */
function toExportName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '')
  return base
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^(\d)/, '_$1')
}

/** Generates /assets/images.ts content from project images */
function generateImagesModule(images: ProjectImage[]): string {
  if (images.length === 0) return ''
  const exports = images
    .map((img) => `export const ${toExportName(img.name)} = '${img.dataUrl}'`)
    .join('\n')
  return `// Auto-generated — do not edit manually\n${exports}\n`
}

export function useProjectImages() {
  const [images, setImages] = useAtom(projectImagesAtom)
  const activeProjectId = useAtomValue(activeProjectIdAtom)
  const { setFiles } = useFiles()

  const syncImagesFile = useCallback((updatedImages: ProjectImage[]) => {
    const module = generateImagesModule(updatedImages)
    setFiles((prev) => {
      const next = { ...prev }
      if (module) {
        next['/assets/images.ts'] = module
      } else {
        delete next['/assets/images.ts']
      }
      return next
    })
  }, [setFiles])

  const addImage = useCallback(async (file: File) => {
    if (!activeProjectId) return

    return new Promise<ProjectImage>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        const image: ProjectImage = {
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl,
          mediaType: file.type,
          size: file.size,
        }

        await db.projectImages.add({ ...image, projectId: activeProjectId })
        const updated = [...images, image]
        setImages(updated)
        syncImagesFile(updated)
        resolve(image)
      }
      reader.onerror = () => reject(new Error('Erro ao ler imagem'))
      reader.readAsDataURL(file)
    })
  }, [activeProjectId, images, setImages, syncImagesFile])

  const renameImage = useCallback(async (id: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) return
    // Preserve original extension if user didn't include one
    const target = images.find((img) => img.id === id)
    if (!target) return
    const hasExt = /\.[^.]+$/.test(trimmed)
    const ext = target.name.match(/\.[^.]+$/)?.[0] || ''
    const finalName = hasExt ? trimmed : `${trimmed}${ext}`

    await db.projectImages.update(id, { name: finalName })
    const updated = images.map((img) => img.id === id ? { ...img, name: finalName } : img)
    setImages(updated)
    syncImagesFile(updated)
  }, [images, setImages, syncImagesFile])

  const removeImage = useCallback(async (id: string) => {
    await db.projectImages.delete(id)
    const updated = images.filter((img) => img.id !== id)
    setImages(updated)
    syncImagesFile(updated)
  }, [images, setImages, syncImagesFile])

  /** Returns image info for AI prompt context */
  const getImagesContext = useCallback((): string => {
    if (images.length === 0) return ''
    const list = images
      .map((img) => `- ${toExportName(img.name)} (${img.name})`)
      .join('\n')
    return `Available project images (import from './assets/images'):\n${list}`
  }, [images])

  return { images, addImage, renameImage, removeImage, getImagesContext }
}

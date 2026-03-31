import { useCallback, useMemo } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { activeProjectIdAtom, projectImagesAtom, type ProjectImage } from '@/atoms'
import { authTokenAtom } from '@/atoms/authAtoms'
import { useFiles } from '@/hooks/useFiles'
import { api } from '@/services/api'
import { usePlanLimit } from '@/hooks/usePlanLimit'

/** Converts a name like "hero-bg.jpg" to a valid JS identifier like "heroBg" */
function toExportName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '')
  return base
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^(\d)/, '_$1')
}

/** Converts a name like "hero-bg.jpg" to a CSS variable name like "--img-hero-bg" */
function toCssVarName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `--img-${base}`
}

/**
 * Generates virtual file contents for /assets/images.ts and /assets/images.css.
 * Images are referenced by their PocketBase URL — no base64 duplication.
 */
export function generateImagesFiles(images: ProjectImage[]): Record<string, string> {
  if (images.length === 0) return {}

  const tsExports = images
    .map((img) => `export const ${toExportName(img.name)} = '${img.dataUrl ?? img.url}'`)
    .join('\n')

  const cssVars = images
    .map((img) => `  ${toCssVarName(img.name)}: url('${img.dataUrl ?? img.url}');`)
    .join('\n')

  return {
    '/assets/images.ts': `// Auto-generated — do not edit manually\n${tsExports}\n`,
    '/assets/images.css': `:root {\n${cssVars}\n}\n`,
  }
}

export function useProjectImages() {
  const [images, setImages] = useAtom(projectImagesAtom)
  const activeProjectId = useAtomValue(activeProjectIdAtom)
  const token = useAtomValue(authTokenAtom)
  const { setFiles } = useFiles()
  const withPlanLimit = usePlanLimit()

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token],
  )

  const syncImagesFiles = useCallback((updatedImages: ProjectImage[]) => {
    setFiles((prev) => {
      const next = { ...prev }
      delete next['/assets/images.ts']
      delete next['/assets/images.css']
      return Object.assign(next, generateImagesFiles(updatedImages))
    })
  }, [setFiles])

  const addImage = useCallback(async (file: File) => {
    if (!activeProjectId || !authHeaders) return

    const formData = new FormData()
    formData.append('file', file)

    const uploaded = await withPlanLimit(() => api.upload<ProjectImage>(`/api/projects/${activeProjectId}/images`, formData, authHeaders))
    if (!uploaded) return

    // Create a local data URL from the original File for use in Sandpack preview
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
    const image = { ...uploaded, dataUrl }

    const updated = [...images, image]
    setImages(updated)
    syncImagesFiles(updated)
    return image
  }, [activeProjectId, authHeaders, images, setImages, syncImagesFiles])

  const renameImage = useCallback(async (id: string, newName: string) => {
    if (!activeProjectId || !authHeaders) return
    const trimmed = newName.trim()
    if (!trimmed) return

    const target = images.find((img) => img.id === id)
    if (!target) return
    const hasExt = /\.[^.]+$/.test(trimmed)
    const ext = target.name.match(/\.[^.]+$/)?.[0] || ''
    const finalName = hasExt ? trimmed : `${trimmed}${ext}`

    await api.patch(`/api/projects/${activeProjectId}/images/${id}`, { name: finalName }, authHeaders)
    const updated = images.map((img) => img.id === id ? { ...img, name: finalName } : img)
    setImages(updated)
    syncImagesFiles(updated)
  }, [activeProjectId, authHeaders, images, setImages, syncImagesFiles])

  const removeImage = useCallback(async (id: string) => {
    if (!activeProjectId || !authHeaders) return

    await api.delete(`/api/projects/${activeProjectId}/images/${id}`, authHeaders)
    const updated = images.filter((img) => img.id !== id)
    setImages(updated)
    syncImagesFiles(updated)
  }, [activeProjectId, authHeaders, images, setImages, syncImagesFiles])

  /** Returns image info for AI prompt context */
  const getImagesContext = useCallback((): string => {
    if (images.length === 0) return ''
    const list = images
      .map((img) => `- ${toExportName(img.name)} (${img.name})\n  URL: ${img.url}\n  CSS var: var(${toCssVarName(img.name)})`)
      .join('\n')
    return `Available project images (import from './assets/images', or use CSS variables, or use the URL directly):\n${list}`
  }, [images])

  return { images, addImage, renameImage, removeImage, getImagesContext }
}

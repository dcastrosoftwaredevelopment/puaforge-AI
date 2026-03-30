import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSetAtom, useAtomValue } from 'jotai'
import { activeProjectIdAtom, messagesAtom, filesAtom, projectImagesAtom, checkpointsAtom, colorPaletteAtom, projectLoadedAtom, DEFAULT_PALETTE, type ProjectImage, type Checkpoint } from '@/atoms'
import { authTokenAtom } from '@/atoms/authAtoms'
import { depsAtom } from '@/hooks/useFiles'
import { DEFAULT_FILES } from '@/utils/defaultFiles'
import { extractDependencies } from '@/services/fileParser'
import { api } from '@/services/api'
import { waitForPersist } from '@/hooks/usePersistence'
import { generateImagesFiles } from '@/hooks/useProjectImages'
import { hasDraft, loadDraft } from '@/hooks/useDraft'

/**
 * Loads project data when projectId changes.
 * Priority: IndexedDB draft (if exists) > PostgreSQL for messages/files.
 * Images and checkpoints always come from PostgreSQL.
 */
export function useProjectLoader(projectId: string | undefined) {
  const navigate = useNavigate()
  const token = useAtomValue(authTokenAtom)
  const setActiveProjectId = useSetAtom(activeProjectIdAtom)
  const setMessages = useSetAtom(messagesAtom)
  const setFiles = useSetAtom(filesAtom)
  const setDeps = useSetAtom(depsAtom)
  const setProjectImages = useSetAtom(projectImagesAtom)
  const setCheckpoints = useSetAtom(checkpointsAtom)
  const setColorPalette = useSetAtom(colorPaletteAtom)
  const setProjectLoaded = useSetAtom(projectLoadedAtom)
  const [isReady, setIsReady] = useState(false)
  const loadedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!projectId || loadedRef.current === projectId) return
    if (!token) {
      navigate('/', { replace: true })
      return
    }

    let cancelled = false
    const headers = { Authorization: `Bearer ${token}` }
    setProjectLoaded(false)

    async function load() {
      await waitForPersist()

      try {
        // Images, checkpoints and palette always from PostgreSQL
        const [rawImages, savedCheckpoints, savedPalette] = await Promise.all([
          api.get<ProjectImage[]>(`/api/projects/${projectId}/images`, headers),
          api.get<Checkpoint[]>(`/api/projects/${projectId}/checkpoints`, headers),
          api.get<typeof DEFAULT_PALETTE | null>(`/api/projects/${projectId}/palette`, headers),
        ])

        // Fetch data URLs for Sandpack preview (browser fetch works even when Sandpack iframe cannot)
        const savedImages = await Promise.all(
          rawImages.map(async (img) => {
            try {
              const res = await fetch(img.url)
              const blob = await res.blob()
              const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.readAsDataURL(blob)
              })
              return { ...img, dataUrl }
            } catch {
              return img
            }
          }),
        )

        if (cancelled) return

        // Messages and files: prefer local draft if it exists
        const draft = await hasDraft(projectId!)
          ? await loadDraft(projectId!)
          : null

        let messages, files: Record<string, string>

        if (draft) {
          messages = draft.messages
          files = Object.keys(draft.files).length > 0 ? draft.files : DEFAULT_FILES
        } else {
          const [apiMessages, apiFiles] = await Promise.all([
            api.get<typeof messagesAtom extends { init: infer T } ? T : never[]>(
              `/api/projects/${projectId}/messages`,
              headers,
            ),
            api.get<Record<string, string>>(`/api/projects/${projectId}/files`, headers),
          ])
          messages = apiMessages
          files = Object.keys(apiFiles).length > 0 ? apiFiles : DEFAULT_FILES
        }

        if (cancelled) return

        const detectedDeps = extractDependencies(files)
        const filesWithImages = savedImages.length > 0
          ? { ...files, ...generateImagesFiles(savedImages) }
          : files

        setColorPalette(savedPalette ?? DEFAULT_PALETTE)
        setProjectImages(savedImages)
        setCheckpoints([...savedCheckpoints].reverse())
        setMessages(messages as never)
        setFiles(filesWithImages)
        setDeps(Object.keys(detectedDeps).length > 0 ? detectedDeps : {})
        setActiveProjectId(projectId!)

        if (!cancelled) {
          loadedRef.current = projectId!
          setProjectLoaded(true)
          setIsReady(true)
        }
      } catch {
        if (!cancelled) navigate('/', { replace: true })
      }
    }

    load()
    return () => { cancelled = true }
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  return isReady
}

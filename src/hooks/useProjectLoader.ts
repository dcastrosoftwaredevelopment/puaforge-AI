import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSetAtom, useAtomValue } from 'jotai'
import { activeProjectIdAtom, messagesAtom, filesAtom, projectImagesAtom, checkpointsAtom, type Message, type ProjectImage, type Checkpoint } from '@/atoms'
import { authTokenAtom } from '@/atoms/authAtoms'
import { depsAtom } from '@/hooks/useFiles'
import { DEFAULT_FILES } from '@/utils/defaultFiles'
import { extractDependencies } from '@/services/fileParser'
import { api } from '@/services/api'
import { waitForPersist } from '@/hooks/usePersistence'
import { generateImagesFiles } from '@/hooks/useProjectImages'

/**
 * Loads project data from PostgreSQL API when projectId changes.
 * Sets atoms BEFORE activeProjectId to prevent persistence race conditions.
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

    async function load() {
      await waitForPersist()

      try {
        const [savedMessages, fileMap, savedImages, savedCheckpoints] = await Promise.all([
          api.get<Message[]>(`/api/projects/${projectId}/messages`, headers),
          api.get<Record<string, string>>(`/api/projects/${projectId}/files`, headers),
          api.get<ProjectImage[]>(`/api/projects/${projectId}/images`, headers),
          api.get<Checkpoint[]>(`/api/projects/${projectId}/checkpoints`, headers),
        ])

        if (cancelled) return

        const files = Object.keys(fileMap).length > 0 ? fileMap : DEFAULT_FILES
        const detectedDeps = extractDependencies(files)

        // Inject generated image files if project has images
        const filesWithImages = savedImages.length > 0
          ? { ...files, ...generateImagesFiles(savedImages) }
          : files

        setProjectImages(savedImages)
        setCheckpoints([...savedCheckpoints].reverse())
        setMessages(savedMessages)
        setFiles(filesWithImages)
        setDeps(Object.keys(detectedDeps).length > 0 ? detectedDeps : {})
        setActiveProjectId(projectId!)

        if (!cancelled) {
          loadedRef.current = projectId!
          setIsReady(true)
        }
      } catch {
        if (!cancelled) {
          navigate('/', { replace: true })
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  return isReady
}

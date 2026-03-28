import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSetAtom } from 'jotai'
import { activeProjectIdAtom, messagesAtom, filesAtom, projectImagesAtom, checkpointsAtom, type Message, type ProjectImage, type Checkpoint } from '@/atoms'
import { depsAtom } from '@/hooks/useFiles'
import { DEFAULT_FILES } from '@/utils/defaultFiles'
import { extractDependencies } from '@/services/fileParser'
import { db, dbReady } from '@/services/db'
import { waitForPersist } from '@/hooks/usePersistence'

/**
 * Loads project data (messages, files, deps) from IndexedDB when projectId changes.
 * Sets atoms BEFORE activeProjectId to prevent persistence race conditions.
 */
export function useProjectLoader(projectId: string | undefined) {
  const navigate = useNavigate()
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

    let cancelled = false

    async function load() {
      await dbReady
      await waitForPersist()

      const project = await db.projects.get(projectId!)
      if (!project) {
        navigate('/', { replace: true })
        return
      }
      if (cancelled) return

      const savedMessages = await db.messages
        .where('projectId')
        .equals(projectId!)
        .sortBy('timestamp')
      if (cancelled) return

      const savedFiles = await db.projectFiles
        .where('projectId')
        .equals(projectId!)
        .toArray()
      if (cancelled) return

      let fileMap: Record<string, string>
      let detectedDeps: Record<string, string> = {}
      if (savedFiles.length > 0) {
        fileMap = {}
        for (const f of savedFiles) fileMap[f.path] = f.code
        detectedDeps = extractDependencies(fileMap)
      } else {
        fileMap = DEFAULT_FILES
      }

      const savedImages = await db.projectImages
        .where('projectId')
        .equals(projectId!)
        .toArray()
      if (cancelled) return

      const savedCheckpoints = await db.checkpoints
        .where('projectId')
        .equals(projectId!)
        .reverse()
        .sortBy('createdAt')
      if (cancelled) return

      // Set data BEFORE activeProjectId to avoid persistence saving stale data
      const projectImages = savedImages.map(({ projectId: _, ...img }) => img) as ProjectImage[]
      setProjectImages(projectImages)
      setCheckpoints(savedCheckpoints.map(({ projectId: _, ...c }) => c) as Checkpoint[])
      setMessages(savedMessages.map(({ projectId: _, ...m }) => m) as Message[])
      // Regenerate /assets/images.ts if project has images
      if (projectImages.length > 0) {
        const exports = projectImages
          .map((img) => {
            const base = img.name.replace(/\.[^.]+$/, '')
            const exportName = base
              .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
              .replace(/[^a-zA-Z0-9]/g, '')
              .replace(/^(\d)/, '_$1')
            return `export const ${exportName} = '${img.dataUrl}'`
          })
          .join('\n')
        fileMap['/assets/images.ts'] = `// Auto-generated — do not edit manually\n${exports}\n`
      }

      setFiles(fileMap)
      setDeps(Object.keys(detectedDeps).length > 0 ? detectedDeps : {})
      setActiveProjectId(projectId!)
      db.settings.put({ key: 'activeProjectId', value: projectId! })

      if (!cancelled) {
        loadedRef.current = projectId!
        setIsReady(true)
      }
    }

    load()
    return () => { cancelled = true }
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  return isReady
}

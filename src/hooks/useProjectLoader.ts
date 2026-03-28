import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSetAtom } from 'jotai'
import { activeProjectIdAtom, messagesAtom, filesAtom, type Message } from '@/atoms'
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

      // Set data BEFORE activeProjectId to avoid persistence saving stale data
      setMessages(savedMessages.map(({ projectId: _, ...m }) => m) as Message[])
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

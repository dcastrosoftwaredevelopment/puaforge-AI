import { useEffect, useRef, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { db, dbReady } from '@/services/db'
import {
  projectsAtom,
  activeProjectIdAtom,
  messagesAtom,
  filesAtom,
  selectedModelAtom,
  viewModeAtom,
  appViewAtom,
  type Message,
  type Project,
  type ViewMode,
} from '@/atoms'
import { depsAtom } from '@/hooks/useFiles'
import { DEFAULT_FILES } from '@/utils/defaultFiles'
import { extractDependencies } from '@/services/fileParser'

export function usePersistence() {
  const setProjects = useSetAtom(projectsAtom)
  const [activeProjectId, setActiveProjectId] = useAtom(activeProjectIdAtom)
  const setMessages = useSetAtom(messagesAtom)
  const setFiles = useSetAtom(filesAtom)
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom)
  const setViewMode = useSetAtom(viewModeAtom)
  const setAppView = useSetAtom(appViewAtom)
  const setDeps = useSetAtom(depsAtom)
  const hydrated = useRef(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate projects list + settings on mount
  useEffect(() => {
    async function hydrate() {
      try {
        await dbReady
        const allProjects = await db.projects.orderBy('updatedAt').reverse().toArray()
        setProjects(allProjects as Project[])

        const modelSetting = await db.settings.get('selectedModel')
        if (modelSetting) setSelectedModel(modelSetting.value)

        const viewModeSetting = await db.settings.get('viewMode')
        if (viewModeSetting) setViewMode(viewModeSetting.value as ViewMode)

        const activeSetting = await db.settings.get('activeProjectId')
        if (activeSetting && allProjects.some((p) => p.id === activeSetting.value)) {
          setActiveProjectId(activeSetting.value)
          setAppView('editor')
        }
      } catch (error) {
        console.error('[persistence] Hydration error:', error)
      } finally {
        hydrated.current = true
        setIsHydrated(true)
      }
    }
    hydrate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load project data when activeProjectId changes
  useEffect(() => {
    if (!hydrated.current || !activeProjectId) return

    async function loadProject() {
      const savedMessages = await db.messages
        .where('projectId')
        .equals(activeProjectId!)
        .sortBy('timestamp')
      setMessages(savedMessages.map(({ projectId: _, ...m }) => m) as Message[])

      const savedFiles = await db.projectFiles
        .where('projectId')
        .equals(activeProjectId!)
        .toArray()

      if (savedFiles.length > 0) {
        const fileMap: Record<string, string> = {}
        for (const f of savedFiles) fileMap[f.path] = f.code
        setFiles(fileMap)

        const detectedDeps = extractDependencies(fileMap)
        if (Object.keys(detectedDeps).length > 0) setDeps(detectedDeps)
        else setDeps({})
      } else {
        setFiles(DEFAULT_FILES)
        setDeps({})
      }

      db.settings.put({ key: 'activeProjectId', value: activeProjectId! })
    }
    loadProject()
  }, [activeProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist messages
  const messagesValue = useAtomValue(messagesAtom)
  useEffect(() => {
    if (!hydrated.current || !activeProjectId) return
    const pid = activeProjectId
    const entries = messagesValue.map((m) => ({ ...m, projectId: pid }))
    db.messages.where('projectId').equals(pid).delete()
      .then(() => db.messages.bulkPut(entries))
  }, [messagesValue, activeProjectId])

  // Persist files
  const filesValue = useAtomValue(filesAtom)
  useEffect(() => {
    if (!hydrated.current || !activeProjectId) return
    const pid = activeProjectId
    const entries = Object.entries(filesValue).map(([path, code]) => ({
      projectId: pid,
      path,
      code,
      updatedAt: Date.now(),
    }))
    db.projectFiles.where('projectId').equals(pid).delete()
      .then(() => db.projectFiles.bulkAdd(entries))
    db.projects.update(pid, { updatedAt: Date.now() })
  }, [filesValue, activeProjectId])

  // Persist settings
  useEffect(() => {
    if (!hydrated.current) return
    db.settings.put({ key: 'selectedModel', value: selectedModel })
  }, [selectedModel])

  const viewMode = useAtomValue(viewModeAtom)
  useEffect(() => {
    if (!hydrated.current) return
    db.settings.put({ key: 'viewMode', value: viewMode })
  }, [viewMode])

  return { isHydrated }
}

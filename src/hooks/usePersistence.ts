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
  devicePreviewAtom,
  isChatOpenAtom,
  type Project,
  type ViewMode,
  type DevicePreview,
} from '@/atoms'

/** Resolves when the latest persistence write is done — lets readers wait for pending saves */
let pendingPersist: Promise<void> = Promise.resolve()
export function waitForPersist() {
  return pendingPersist
}

export function usePersistence() {
  const setProjects = useSetAtom(projectsAtom)
  const activeProjectId = useAtomValue(activeProjectIdAtom)
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom)
  const setViewMode = useSetAtom(viewModeAtom)
  const setDevicePreview = useSetAtom(devicePreviewAtom)
  const setIsChatOpen = useSetAtom(isChatOpenAtom)
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

        const deviceSetting = await db.settings.get('devicePreview')
        if (deviceSetting) setDevicePreview(deviceSetting.value as DevicePreview)

        const chatOpenSetting = await db.settings.get('isChatOpen')
        if (chatOpenSetting) setIsChatOpen(chatOpenSetting.value === 'true')
      } catch (error) {
        console.error('[persistence] Hydration error:', error)
      } finally {
        hydrated.current = true
        setIsHydrated(true)
      }
    }
    hydrate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist messages — atomic transaction
  const messagesValue = useAtomValue(messagesAtom)
  useEffect(() => {
    if (!hydrated.current || !activeProjectId) return
    const pid = activeProjectId
    const entries = messagesValue.map((m) => ({ ...m, projectId: pid }))
    pendingPersist = db.transaction('rw', db.messages, async () => {
      await db.messages.where('projectId').equals(pid).delete()
      await db.messages.bulkPut(entries)
    }).catch((e) => console.error('[persistence] messages save error:', e))
  }, [messagesValue, activeProjectId])

  // Persist files — atomic transaction
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
    pendingPersist = db.transaction('rw', db.projectFiles, async () => {
      await db.projectFiles.where('projectId').equals(pid).delete()
      await db.projectFiles.bulkAdd(entries)
    }).then(() => {
      db.projects.update(pid, { updatedAt: Date.now() })
    }).catch((e) => console.error('[persistence] files save error:', e))
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

  const devicePreview = useAtomValue(devicePreviewAtom)
  useEffect(() => {
    if (!hydrated.current) return
    db.settings.put({ key: 'devicePreview', value: devicePreview })
  }, [devicePreview])

  const isChatOpen = useAtomValue(isChatOpenAtom)
  useEffect(() => {
    if (!hydrated.current) return
    db.settings.put({ key: 'isChatOpen', value: String(isChatOpen) })
  }, [isChatOpen])

  return { isHydrated }
}

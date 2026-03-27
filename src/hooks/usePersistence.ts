import { useEffect, useRef, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { db } from '@/services/db'
import {
  messagesAtom,
  filesAtom,
  selectedModelAtom,
  viewModeAtom,
  type Message,
  type ViewMode,
} from '@/atoms'
import { depsAtom } from '@/hooks/useFiles'
import { DEFAULT_FILES } from '@/utils/defaultFiles'
import { extractDependencies } from '@/services/fileParser'

export function usePersistence() {
  const setMessages = useSetAtom(messagesAtom)
  const setFiles = useSetAtom(filesAtom)
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom)
  const setViewMode = useSetAtom(viewModeAtom)
  const setDeps = useSetAtom(depsAtom)
  const hydrated = useRef(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    async function hydrate() {
      try {
        // Load messages
        const savedMessages = await db.messages.orderBy('timestamp').toArray()
        if (savedMessages.length > 0) {
          setMessages(savedMessages as Message[])
        }

        // Load project files and detect dependencies
        const savedFiles = await db.projectFiles.toArray()
        if (savedFiles.length > 0) {
          const fileMap: Record<string, string> = {}
          for (const f of savedFiles) {
            fileMap[f.path] = f.code
          }
          setFiles(fileMap)

          const detectedDeps = extractDependencies(fileMap)
          if (Object.keys(detectedDeps).length > 0) {
            console.log('[persistence] Detected dependencies from files:', detectedDeps)
            setDeps(detectedDeps)
          }
        }

        // Load settings
        const modelSetting = await db.settings.get('selectedModel')
        if (modelSetting) {
          setSelectedModel(modelSetting.value)
        }

        const viewModeSetting = await db.settings.get('viewMode')
        if (viewModeSetting) {
          setViewMode(viewModeSetting.value as ViewMode)
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

  // Persist messages
  const messagesValue = useAtomValue(messagesAtom)
  useEffect(() => {
    if (!hydrated.current) return
    db.messages.clear().then(() => db.messages.bulkPut(messagesValue))
  }, [messagesValue])

  // Persist files
  const filesValue = useAtomValue(filesAtom)
  useEffect(() => {
    if (!hydrated.current) return
    const entries = Object.entries(filesValue).map(([path, code]) => ({
      path,
      code,
      updatedAt: Date.now(),
    }))
    db.projectFiles.clear().then(() => db.projectFiles.bulkPut(entries))
  }, [filesValue])

  // Persist selected model
  useEffect(() => {
    if (!hydrated.current) return
    db.settings.put({ key: 'selectedModel', value: selectedModel })
  }, [selectedModel])

  // Persist view mode
  const viewMode = useAtomValue(viewModeAtom)
  useEffect(() => {
    if (!hydrated.current) return
    db.settings.put({ key: 'viewMode', value: viewMode })
  }, [viewMode])



  return {
    isHydrated,
    clearAll: async () => {
      await Promise.all([
        db.messages.clear(),
        db.projectFiles.clear(),
        db.settings.clear(),
      ])
      setMessages([])
      setFiles(DEFAULT_FILES)
      setSelectedModel('claude-haiku-4-5-20251001')
      setViewMode('preview')
      setDeps({})
    },
  }
}

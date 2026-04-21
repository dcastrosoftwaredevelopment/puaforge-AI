import { useEffect, useRef, useState, useCallback } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { authTokenAtom } from '@/atoms/authAtoms'
import {
  projectsAtom,
  selectedModelAtom,
  viewModeAtom,
  devicePreviewAtom,
  isChatOpenAtom,
  editorFractionAtom,
  chatWidthAtom,
  type Project,
  type ViewMode,
  type DevicePreview,
} from '@/atoms'
import { api } from '@/services/api'

// ─── localStorage helpers ─────────────────────────────────────────────────────

function lsGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function lsSet(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* ignore */ }
}

function useDebounced(fn: (value: string) => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback((value: string) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(value), delay)
  }, [fn, delay])
}

// ─── Hook for useProjectLoader to wait for projects to load ───────────────────

let pendingHydration: Promise<void> = Promise.resolve()
export function waitForPersist() {
  return pendingHydration
}

interface ApiProject {
  id: string; name: string; createdAt: number; updatedAt: number
}

export function usePersistence() {
  const token = useAtomValue(authTokenAtom)
  const setProjects = useSetAtom(projectsAtom)
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom)
  const setViewMode = useSetAtom(viewModeAtom)
  const setDevicePreview = useSetAtom(devicePreviewAtom)
  const setIsChatOpen = useSetAtom(isChatOpenAtom)
  const setEditorFraction = useSetAtom(editorFractionAtom)
  const setChatWidth = useSetAtom(chatWidthAtom)
  const hydrated = useRef(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate UI settings from localStorage (once) + projects from API when token is available
  useEffect(() => {
    async function hydrate() {
      try {
        // UI preferences from localStorage — only on the first run
        if (!hydrated.current) {
          const model = lsGet('selectedModel')
          if (model) setSelectedModel(model)

          const viewMode = lsGet('viewMode')
          if (viewMode) setViewMode(viewMode as ViewMode)

          const device = lsGet('devicePreview')
          if (device) setDevicePreview(device as DevicePreview)

          const chatOpen = lsGet('isChatOpen')
          if (chatOpen !== null) setIsChatOpen(chatOpen === 'true')

          const editorFraction = lsGet('editorFraction')
          if (editorFraction) setEditorFraction(parseFloat(editorFraction))

          const chatWidth = lsGet('chatWidth')
          if (chatWidth) setChatWidth(parseInt(chatWidth, 10))
        }

        // Projects from API (requires auth) — runs whenever token becomes available
        if (token) {
          let resolve!: () => void
          pendingHydration = new Promise<void>((r) => { resolve = r })

          const projects = await api.get<ApiProject[]>('/api/projects', {
            Authorization: `Bearer ${token}`,
          })
          setProjects(projects.sort((a, b) => b.updatedAt - a.updatedAt) as Project[])
          resolve()
        }
      } catch (error) {
        console.error('[persistence] Hydration error:', error)
      } finally {
        hydrated.current = true
        setIsHydrated(true)
      }
    }
    hydrate()
  }, [token]) // re-runs when token changes (e.g. after login)

  // Persist UI settings to localStorage
  useEffect(() => {
    if (!hydrated.current) return
    lsSet('selectedModel', selectedModel)
  }, [selectedModel])

  const viewMode = useAtomValue(viewModeAtom)
  useEffect(() => {
    if (!hydrated.current) return
    lsSet('viewMode', viewMode)
  }, [viewMode])

  const devicePreview = useAtomValue(devicePreviewAtom)
  useEffect(() => {
    if (!hydrated.current) return
    lsSet('devicePreview', devicePreview)
  }, [devicePreview])

  const isChatOpen = useAtomValue(isChatOpenAtom)
  useEffect(() => {
    if (!hydrated.current) return
    lsSet('isChatOpen', String(isChatOpen))
  }, [isChatOpen])

  const saveEditorFraction = useDebounced((v) => lsSet('editorFraction', v), 300)
  const editorFraction = useAtomValue(editorFractionAtom)
  useEffect(() => {
    if (!hydrated.current) return
    saveEditorFraction(String(editorFraction))
  }, [editorFraction, saveEditorFraction])

  const saveChatWidth = useDebounced((v) => lsSet('chatWidth', v), 300)
  const chatWidth = useAtomValue(chatWidthAtom)
  useEffect(() => {
    if (!hydrated.current) return
    saveChatWidth(String(chatWidth))
  }, [chatWidth, saveChatWidth])

  return { isHydrated }
}

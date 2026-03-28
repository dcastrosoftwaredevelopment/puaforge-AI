import { useCallback, useEffect, useState } from 'react'
import { useAtomValue } from 'jotai'
import { activeProjectIdAtom } from '@/atoms'
import { useFiles } from '@/hooks/useFiles'
import { db, dbReady } from '@/services/db'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface PublishState {
  isPublishing: boolean
  publishedAt: number | null
  error: string | null
}

export function usePublish() {
  const activeProjectId = useAtomValue(activeProjectIdAtom)
  const { files } = useFiles()
  const [state, setState] = useState<PublishState>({
    isPublishing: false,
    publishedAt: null,
    error: null,
  })

  // Load existing published state on project change
  useEffect(() => {
    if (!activeProjectId) return
    dbReady.then(async () => {
      const site = await db.publishedSites.get(activeProjectId)
      if (site) {
        setState((prev) => ({ ...prev, publishedAt: site.publishedAt }))
      } else {
        setState((prev) => ({ ...prev, publishedAt: null }))
      }
    })
  }, [activeProjectId])

  const publish = useCallback(async () => {
    if (!activeProjectId || state.isPublishing) return

    setState((prev) => ({ ...prev, isPublishing: true, error: null }))

    try {
      const response = await fetch(`${API_URL}/api/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: activeProjectId, files }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao gerar preview')
      }

      const data = await response.json()

      // Save to IndexedDB
      await db.publishedSites.put({
        projectId: activeProjectId,
        html: data.html,
        publishedAt: data.publishedAt,
      })

      setState({
        isPublishing: false,
        publishedAt: data.publishedAt,
        error: null,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar preview'
      setState((prev) => ({ ...prev, isPublishing: false, error: message }))
    }
  }, [activeProjectId, files, state.isPublishing])

  const openPublished = useCallback(async () => {
    if (!activeProjectId) return
    const site = await db.publishedSites.get(activeProjectId)
    if (!site) return

    const blob = new Blob([site.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }, [activeProjectId])

  return { ...state, publish, openPublished }
}

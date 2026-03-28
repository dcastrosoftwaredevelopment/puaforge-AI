import { useEffect, useRef, useState, useCallback } from 'react'
import { useAtom } from 'jotai'
import { availableModelsAtom, selectedModelAtom } from '@/atoms'
import { useApiKey } from './useApiKey'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function useModels() {
  const [models, setModels] = useAtom(availableModelsAtom)
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom)
  const [loading, setLoading] = useState(false)
  const { effectiveApiKey } = useApiKey()
  const fetched = useRef(false)

  const fetchModels = useCallback((key?: string) => {
    setLoading(true)
    const headers: Record<string, string> = {}
    if (key) headers['X-API-Key'] = key
    fetch(`${API_URL}/api/models`, { headers })
      .then((res) => res.json())
      .then((data) => {
        const list = data.models || []
        setModels(list)
        if (list.length > 0 && !selectedModel) {
          setSelectedModel(list[0].id)
        }
      })
      .catch((err) => console.error('[models] Failed to fetch:', err))
      .finally(() => setLoading(false))
  }, [setModels, selectedModel, setSelectedModel])

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    fetchModels(effectiveApiKey || undefined)
  }, [fetchModels, effectiveApiKey])

  const refetchModels = useCallback(() => {
    fetchModels(effectiveApiKey || undefined)
  }, [fetchModels, effectiveApiKey])

  return { models, selectedModel, setSelectedModel, loading, refetchModels }
}

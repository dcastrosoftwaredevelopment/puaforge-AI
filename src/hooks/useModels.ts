import { useEffect, useRef, useState } from 'react'
import { useAtom } from 'jotai'
import { availableModelsAtom, selectedModelAtom } from '@/atoms'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function useModels() {
  const [models, setModels] = useAtom(availableModelsAtom)
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom)
  const [loading, setLoading] = useState(false)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true

    setLoading(true)
    fetch(`${API_URL}/api/models`)
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

  return { models, selectedModel, setSelectedModel, loading }
}

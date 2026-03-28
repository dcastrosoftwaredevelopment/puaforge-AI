import { useState, useRef, useEffect } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { ChevronDown, Check, Cpu, Loader2 } from 'lucide-react'
import { selectedModelAtom, availableModelsAtom } from '@/atoms'

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

  return { models, loading }
}

export default function ModelSelector() {
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom)
  const models = useAtomValue(availableModelsAtom)
  const { loading } = useModels()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = models.find((m) => m.id === selectedModel)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-text-muted">
        <Loader2 size={12} className="animate-spin" />
        <span>Carregando modelos...</span>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-text-muted">
        <Cpu size={12} />
        <span>Sem modelos</span>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-tertiary border border-border-subtle text-text-secondary text-xs hover:text-text-primary hover:border-border-default transition"
      >
        <Cpu size={12} />
        <span>{current?.name || selectedModel}</span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1.5 w-72 max-h-64 overflow-y-auto bg-bg-elevated border border-border-default rounded-xl shadow-2xl shadow-black/50 z-50 py-1">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                setSelectedModel(model.id)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition hover:bg-accent-muted ${
                selectedModel === model.id ? 'bg-accent-muted' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-text-primary">{model.name}</span>
                <div className="text-[10px] text-text-muted truncate">{model.id}</div>
              </div>
              {selectedModel === model.id && (
                <Check size={14} className="text-text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Cpu, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useModels } from '@/hooks/useModels'

export default function ModelSelector() {
  const { models, selectedModel, setSelectedModel, loading } = useModels()
  const { t } = useTranslation()
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
        <span>{t('chat.loadingModels')}</span>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-text-muted">
        <Cpu size={12} />
        <span>{t('chat.noModels')}</span>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-tertiary border border-forge-terracotta/20 text-text-secondary text-xs hover:text-forge-terracotta hover:border-forge-terracotta/40 transition"
      >
        <Cpu size={12} className="text-forge-terracotta" />
        <span>{current?.name || selectedModel}</span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1.5 w-72 max-h-64 overflow-y-auto bg-bg-elevated border border-forge-terracotta/20 rounded-xl shadow-2xl shadow-black/50 z-50 py-1">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                setSelectedModel(model.id)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition hover:bg-forge-terracotta/10 ${
                selectedModel === model.id ? 'bg-forge-terracotta/10' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-text-primary">{model.name}</span>
                <div className="text-[10px] text-text-muted truncate">{model.id}</div>
              </div>
              {selectedModel === model.id && (
                <Check size={14} className="text-forge-terracotta shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

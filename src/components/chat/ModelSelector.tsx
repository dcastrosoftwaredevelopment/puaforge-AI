import { useState, useRef, useEffect } from 'react'
import { useAtom } from 'jotai'
import { ChevronDown, Check, Cpu } from 'lucide-react'
import { selectedModelAtom, CLAUDE_MODELS } from '@/atoms'

export default function ModelSelector() {
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom)
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = CLAUDE_MODELS.find((m) => m.id === selectedModel) || CLAUDE_MODELS[0]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-tertiary border border-border-subtle text-text-secondary text-xs hover:text-text-primary hover:border-border-default transition"
      >
        <Cpu size={12} />
        <span>{current.name}</span>
        {current.tier === 'free' && (
          <span className="text-[9px] px-1 py-px rounded bg-accent-muted text-text-muted">free</span>
        )}
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1.5 w-60 bg-bg-elevated border border-border-default rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 py-1">
          {CLAUDE_MODELS.map((model) => (
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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text-primary">{model.name}</span>
                  {model.tier === 'free' && (
                    <span className="text-[9px] px-1 py-px rounded bg-accent-muted text-text-muted">free</span>
                  )}
                </div>
                <div className="text-[10px] text-text-muted">{model.description}</div>
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

import { useState, useRef, useEffect } from 'react'
import { Globe, Loader2, ExternalLink } from 'lucide-react'
import { usePublish } from '@/hooks/usePublish'
import Tooltip from '@/components/ui/Tooltip'

export default function PublishButton() {
  const { isPublishing, publishedAt, error, publish, openPublished } = usePublish()
  const [showPanel, setShowPanel] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showPanel) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPanel])

  const handlePublish = async () => {
    await publish()
    setShowPanel(true)
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="relative" ref={panelRef}>
      <Tooltip content="Gerar preview local do site" side="bottom" align="right">
      <button
        onClick={publishedAt ? () => setShowPanel(!showPanel) : handlePublish}
        disabled={isPublishing}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-vibe-blue/10 text-vibe-blue border border-vibe-blue/20 hover:bg-vibe-blue/20 disabled:opacity-50 transition cursor-pointer"
      >
        {isPublishing ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Globe size={13} />
        )}
        {isPublishing ? 'Gerando...' : 'Preview'}
      </button>
      </Tooltip>

      {showPanel && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-bg-secondary border border-border-default rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
          <div className="p-3 space-y-3">
            {error && (
              <div className="text-xs text-forge-terracotta bg-forge-terracotta/10 border border-forge-terracotta/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {publishedAt && (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-secondary">Preview gerado</span>
                    <span className="text-[10px] text-text-muted">{formatDate(publishedAt)}</span>
                  </div>
                  <button
                    onClick={openPublished}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-vibe-blue/10 text-vibe-blue border border-vibe-blue/20 hover:bg-vibe-blue/20 transition cursor-pointer"
                  >
                    <ExternalLink size={12} />
                    Abrir preview
                  </button>
                </div>

                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-50 transition cursor-pointer"
                >
                  {isPublishing ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Globe size={12} />
                  )}
                  {isPublishing ? 'Gerando...' : 'Regerar preview'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

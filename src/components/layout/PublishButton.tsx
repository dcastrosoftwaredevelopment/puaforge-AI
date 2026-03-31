import { useState, useRef, useEffect } from 'react'

declare const __SERVER_IP__: string
import { Globe, Loader2, ExternalLink, Check } from 'lucide-react'
import { usePublish } from '@/hooks/usePublish'
import { useCustomDomain } from '@/hooks/useCustomDomain'
import Tooltip from '@/components/ui/Tooltip'

export default function PublishButton() {
  const { isPublishing, publishedAt, error, publish, openPublished } = usePublish()
  const { customDomain, saveDomain } = useCustomDomain()
  const [showPanel, setShowPanel] = useState(false)
  const [domainInput, setDomainInput] = useState('')
  const [savingDomain, setSavingDomain] = useState(false)
  const [domainError, setDomainError] = useState<string | null>(null)
  const [domainSaved, setDomainSaved] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Sync input with current domain when panel opens
  useEffect(() => {
    if (showPanel) setDomainInput(customDomain ?? '')
  }, [showPanel, customDomain])

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

  const handleSaveDomain = async () => {
    setSavingDomain(true)
    setDomainError(null)
    try {
      await saveDomain(domainInput || null)
      setDomainSaved(true)
      setTimeout(() => setDomainSaved(false), 2000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar domínio'
      setDomainError(msg)
    } finally {
      setSavingDomain(false)
    }
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
      <Tooltip content="Publicar site" side="bottom" align="right">
        <button
          onClick={() => setShowPanel(!showPanel)}
          disabled={isPublishing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-vibe-blue/10 text-vibe-blue border border-vibe-blue/20 hover:bg-vibe-blue/20 disabled:opacity-50 transition cursor-pointer"
        >
          {isPublishing ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
          {isPublishing ? 'Publicando...' : 'Publicar'}
        </button>
      </Tooltip>

      {showPanel && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-bg-secondary border border-border-default rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
          <div className="p-3 space-y-3">

            {/* Domain config */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-text-secondary">Domínio personalizado</span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveDomain() }}
                  placeholder="meu-site.com"
                  className="flex-1 bg-bg-elevated border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-vibe-blue/40 font-mono"
                />
                <button
                  onClick={handleSaveDomain}
                  disabled={savingDomain}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-50 transition cursor-pointer"
                >
                  {savingDomain ? <Loader2 size={12} className="animate-spin" /> : domainSaved ? <Check size={12} className="text-vibe-blue" /> : 'Salvar'}
                </button>
              </div>
              {domainError && (
                <p className="text-[10px] text-forge-terracotta">{domainError}</p>
              )}
              {__SERVER_IP__ ? (
                <p className="text-[10px] text-text-muted leading-relaxed">
                  Aponte um registro <span className="font-mono text-text-secondary">A</span> no DNS do seu domínio para{' '}
                  <span className="font-mono text-vibe-blue select-all">{__SERVER_IP__}</span>.
                </p>
              ) : (
                <p className="text-[10px] text-text-muted leading-relaxed">
                  Aponte um registro <span className="font-mono text-text-secondary">A</span> no DNS do seu domínio para o IP deste servidor.
                </p>
              )}
            </div>

            <div className="border-t border-border-subtle" />

            {/* Publish action */}
            {error && (
              <div className="text-xs text-forge-terracotta bg-forge-terracotta/10 border border-forge-terracotta/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {publishedAt && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-text-secondary">Última publicação</span>
                  <span className="text-[10px] text-text-muted">{formatDate(publishedAt)}</span>
                </div>
                {customDomain && (
                  <a
                    href={`https://${customDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-vibe-blue/10 text-vibe-blue border border-vibe-blue/20 hover:bg-vibe-blue/20 transition"
                  >
                    <ExternalLink size={12} />
                    {customDomain}
                  </a>
                )}
                <button
                  onClick={openPublished}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition cursor-pointer"
                >
                  <ExternalLink size={12} />
                  Abrir preview local
                </button>
              </div>
            )}

            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-vibe-blue/10 text-vibe-blue border border-vibe-blue/20 hover:bg-vibe-blue/20 disabled:opacity-50 transition cursor-pointer"
            >
              {isPublishing ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
              {isPublishing ? 'Publicando...' : publishedAt ? 'Republicar' : 'Publicar agora'}
            </button>

          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useRef, useEffect, useCallback } from 'react'
import { Home, ImageIcon, History, RotateCcw, Save, Trash2, Palette } from 'lucide-react'
import { useProjectActions } from '@/hooks/useProjectActions'
import { useProjectImages } from '@/hooks/useProjectImages'
import { useCheckpoints } from '@/hooks/useCheckpoints'
import { usePanelSizes } from '@/hooks/usePanelSizes'
import { useDraft } from '@/hooks/useDraft'
import ViewToggle from '@/components/layout/ViewToggle'
import DeviceToggle from '@/components/layout/DeviceToggle'
import ExportButton from '@/components/layout/ExportButton'
import BuildDownloadButton from '@/components/layout/BuildDownloadButton'
import PublishButton from '@/components/layout/PublishButton'
import ProjectName from '@/components/layout/ProjectName'
import ImageAssets from '@/components/layout/ImageAssets'
import Checkpoints from '@/components/layout/Checkpoints'
import ColorPalette from '@/components/layout/ColorPalette'
import ConfirmModal from '@/components/ui/ConfirmModal'
import Tooltip from '@/components/ui/Tooltip'

export default function EditorHeader() {
  const { goHome } = useProjectActions()
  const { images } = useProjectImages()
  const { checkpoints } = useCheckpoints()
  const { resetPanels } = usePanelSizes()
  const { isDraft, saveDraft, discardDraft } = useDraft()
  const [showImages, setShowImages] = useState(false)
  const [showCheckpoints, setShowCheckpoints] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const checkpointRef = useRef<HTMLDivElement>(null)
  const paletteRef = useRef<HTMLDivElement>(null)

  const handleSave = useCallback(async () => {
    setSaving(true)
    try { await saveDraft() } finally { setSaving(false) }
  }, [saveDraft])

  const handleDiscard = useCallback(async () => {
    await discardDraft()
    setShowDiscardModal(false)
    window.location.reload()
  }, [discardDraft])

  useEffect(() => {
    if (!showImages && !showCheckpoints && !showPalette) return
    function handleClick(e: MouseEvent) {
      if (showImages && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowImages(false)
      }
      if (showCheckpoints && checkpointRef.current && !checkpointRef.current.contains(e.target as Node)) {
        setShowCheckpoints(false)
      }
      if (showPalette && paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setShowPalette(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showImages, showCheckpoints, showPalette])

  return (
    <>
      <header className="h-11 border-b border-border-subtle flex items-center justify-between px-4 shrink-0 bg-bg-secondary">
        <div className="flex items-center gap-3">
          <Tooltip content="Voltar para projetos" side="bottom" align="left">
            <button
              onClick={goHome}
              className="p-1.5 rounded-lg text-forge-terracotta/60 hover:text-forge-terracotta hover:bg-forge-terracotta/10 transition cursor-pointer"
            >
              <Home size={15} />
            </button>
          </Tooltip>
          <div className="w-px h-4 bg-border-subtle" />
          <ProjectName />
        </div>

        <div className="flex items-center gap-3">
          {/* Images */}
          <div className="relative" ref={panelRef}>
            <Tooltip content="Imagens do projeto" side="bottom" align="right">
              <button
                onClick={() => setShowImages(!showImages)}
                className="flex items-center gap-1.5 p-1.5 rounded-lg text-forge-terracotta/60 hover:text-forge-terracotta hover:bg-forge-terracotta/10 transition cursor-pointer"
              >
                <ImageIcon size={15} />
                {images.length > 0 && (
                  <span className="text-[10px] text-text-secondary">{images.length}</span>
                )}
              </button>
            </Tooltip>
            {showImages && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-bg-secondary border border-border-default rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
                <ImageAssets />
              </div>
            )}
          </div>

          {/* Color palette */}
          <div className="relative" ref={paletteRef}>
            <Tooltip content="Paleta de cores" side="bottom" align="right">
              <button
                onClick={() => setShowPalette(!showPalette)}
                className="p-1.5 rounded-lg text-forge-terracotta/60 hover:text-forge-terracotta hover:bg-forge-terracotta/10 transition cursor-pointer"
              >
                <Palette size={15} />
              </button>
            </Tooltip>
            {showPalette && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-bg-secondary border border-border-default rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
                <ColorPalette />
              </div>
            )}
          </div>

          {/* Checkpoints */}
          <div className="relative" ref={checkpointRef}>
            <Tooltip content="Checkpoints do projeto" side="bottom" align="right">
              <button
                onClick={() => setShowCheckpoints(!showCheckpoints)}
                className="flex items-center gap-1.5 p-1.5 rounded-lg text-forge-terracotta/60 hover:text-forge-terracotta hover:bg-forge-terracotta/10 transition cursor-pointer"
              >
                <History size={15} />
                {checkpoints.length > 0 && (
                  <span className="text-[10px] text-text-secondary">{checkpoints.length}</span>
                )}
              </button>
            </Tooltip>
            {showCheckpoints && (
              <div className="absolute right-0 top-full mt-1 w-80 bg-bg-secondary border border-border-default rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
                <Checkpoints />
              </div>
            )}
          </div>

          {/* Reset panels */}
          <Tooltip content="Resetar tamanho dos painéis" side="bottom" align="right">
            <button
              onClick={resetPanels}
              className="p-1.5 rounded-lg text-forge-terracotta/60 hover:text-forge-terracotta hover:bg-forge-terracotta/10 transition cursor-pointer"
            >
              <RotateCcw size={14} />
            </button>
          </Tooltip>

          <DeviceToggle />
          <ViewToggle />

          {/* Draft controls */}
          {isDraft && (
            <>
              <div className="w-px h-4 bg-border-subtle" />
              <Tooltip
                content={<>Alterações salvas localmente. Clique em <strong className="text-text-primary">Salvar</strong> para não perder as modificações.</>}
                side="bottom"
                align="center"
                width="w-44"
              >
                <span className="flex items-center gap-1.5 text-[11px] text-text-muted cursor-default">
                  <span className="w-1.5 h-1.5 rounded-full bg-forge-terracotta animate-pulse" />
                  Rascunho local
                </span>
              </Tooltip>
              <Tooltip content="Descartar rascunho e reverter para a versão salva" side="bottom" align="right" width="w-44">
                <button
                  onClick={() => setShowDiscardModal(true)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-forge-terracotta hover:bg-forge-terracotta/10 transition cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </Tooltip>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-50 transition cursor-pointer"
              >
                <Save size={13} />
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </>
          )}

          <ExportButton />
          <BuildDownloadButton />
          <PublishButton />
        </div>
      </header>

      <ConfirmModal
        open={showDiscardModal}
        title="Descartar rascunho"
        message="Isso vai apagar todas as alterações locais não salvas e reverter o projeto para a última versão salva. Essa ação não pode ser desfeita."
        confirmLabel="Descartar"
        cancelLabel="Cancelar"
        onConfirm={handleDiscard}
        onCancel={() => setShowDiscardModal(false)}
      />
    </>
  )
}

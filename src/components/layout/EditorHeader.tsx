import { useState, useRef, useEffect, useCallback } from 'react'
import { Home, ImageIcon, History, RotateCcw, Save, Trash2, Palette, MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
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
  const { t } = useTranslation()
  const [showImages, setShowImages] = useState(false)
  const [showCheckpoints, setShowCheckpoints] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const mobilePanelRef = useRef<HTMLDivElement>(null)
  const checkpointRef = useRef<HTMLDivElement>(null)
  const mobileCheckpointRef = useRef<HTMLDivElement>(null)
  const paletteRef = useRef<HTMLDivElement>(null)
  const mobilePaletteRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

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
    if (!showImages && !showCheckpoints && !showPalette && !showMobileMenu) return
    function handleClick(e: MouseEvent) {
      if (showImages) {
        const inside = panelRef.current?.contains(e.target as Node) || mobilePanelRef.current?.contains(e.target as Node)
        if (!inside) setShowImages(false)
      }
      if (showCheckpoints) {
        const inside = checkpointRef.current?.contains(e.target as Node) || mobileCheckpointRef.current?.contains(e.target as Node)
        if (!inside) setShowCheckpoints(false)
      }
      if (showPalette) {
        const inside = paletteRef.current?.contains(e.target as Node) || mobilePaletteRef.current?.contains(e.target as Node)
        if (!inside) setShowPalette(false)
      }
      if (showMobileMenu && mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMobileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showImages, showCheckpoints, showPalette, showMobileMenu])

  return (
    <>
      <header className="h-11 border-b border-border-subtle flex items-center justify-between px-4 shrink-0 bg-bg-secondary">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Tooltip content={t('editor.backToProjects')} side="bottom" align="left">
            <button
              onClick={goHome}
              className="shrink-0 p-1.5 rounded-lg text-forge-terracotta/60 hover:text-forge-terracotta hover:bg-forge-terracotta/10 transition cursor-pointer"
            >
              <Home size={15} />
            </button>
          </Tooltip>
          <div className="shrink-0 w-px h-4 bg-border-subtle" />
          <ProjectName />
        </div>

        {/* ── Desktop actions ── */}
        <div className="hidden md:flex items-center gap-3">
          {/* Images */}
          <div className="relative" ref={panelRef}>
            <Tooltip content={t('editor.images')} side="bottom" align="right">
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
            <Tooltip content={t('editor.palette')} side="bottom" align="right">
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
            <Tooltip content={t('editor.checkpoints')} side="bottom" align="right">
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
          <Tooltip content={t('editor.resetPanels')} side="bottom" align="right">
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
                content={<>{t('editor.draftTooltip').replace('**Salvar**', '')}<strong className="text-text-primary">{t('common.save')}</strong>{t('editor.draftTooltip').split('**Salvar**')[1]}</>}
                side="bottom"
                align="center"
                width="w-44"
              >
                <span className="flex items-center gap-1.5 text-[11px] text-text-muted cursor-default">
                  <span className="w-1.5 h-1.5 rounded-full bg-forge-terracotta animate-pulse" />
                  {t('editor.draftLabel')}
                </span>
              </Tooltip>
              <Tooltip content={t('editor.discardTooltip')} side="bottom" align="right" width="w-44">
                <button
                  onClick={() => setShowDiscardModal(true)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-forge-terracotta hover:bg-forge-terracotta/10 transition cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </Tooltip>
              <Button variant="terracotta" size="xs" isLoading={saving} onClick={handleSave} className="gap-1.5">
                <Save size={13} />
                {saving ? t('common.saving') : t('common.save')}
              </Button>
            </>
          )}

          <ExportButton />
          <BuildDownloadButton />
          <PublishButton />
        </div>

        {/* ── Mobile actions ── */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <PublishButton />
          {/* More menu */}
          <div className="relative" ref={mobileMenuRef}>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="relative p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
            >
              <MoreHorizontal size={16} />
              {isDraft && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-forge-terracotta" />
              )}
            </button>
            {showMobileMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-bg-secondary border border-border-default rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden p-1 space-y-0.5">
                {/* Images */}
                <button
                  onClick={() => { setShowMobileMenu(false); setShowImages(!showImages) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
                >
                  <ImageIcon size={14} className="text-forge-terracotta/60" />
                  {t('editor.images')}
                  {images.length > 0 && <span className="ml-auto text-[10px] text-text-muted">{images.length}</span>}
                </button>
                {/* Palette */}
                <button
                  onClick={() => { setShowMobileMenu(false); setShowPalette(!showPalette) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
                >
                  <Palette size={14} className="text-forge-terracotta/60" />
                  {t('editor.palette')}
                </button>
                {/* Checkpoints */}
                <button
                  onClick={() => { setShowMobileMenu(false); setShowCheckpoints(!showCheckpoints) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
                >
                  <History size={14} className="text-forge-terracotta/60" />
                  {t('editor.checkpoints')}
                  {checkpoints.length > 0 && <span className="ml-auto text-[10px] text-text-muted">{checkpoints.length}</span>}
                </button>
                <div className="border-t border-border-subtle my-1" />
                <ExportButton menuItem />
                <BuildDownloadButton menuItem />
                {isDraft && (
                  <>
                    <div className="border-t border-border-subtle my-1" />
                    <button
                      onClick={() => { setShowMobileMenu(false); void handleSave() }}
                      disabled={saving}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-accent hover:bg-accent/10 disabled:opacity-50 transition cursor-pointer"
                    >
                      <Save size={14} />
                      {saving ? t('common.saving') : t('editor.saveDraft')}
                    </button>
                    <button
                      onClick={() => { setShowMobileMenu(false); setShowDiscardModal(true) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-forge-terracotta hover:bg-forge-terracotta/10 transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                      {t('editor.discardTitle')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {/* Dropdowns rendered outside the menu so they stay accessible */}
          {showImages && (
            <div className="absolute right-4 top-12 w-[calc(100vw-2rem)] max-w-72 max-h-[calc(100svh-5rem)] bg-bg-secondary border border-border-default rounded-xl shadow-2xl shadow-black/40 z-50 overflow-y-auto overflow-x-hidden" ref={mobilePanelRef}>
              <ImageAssets />
            </div>
          )}
          {showPalette && (
            <div className="absolute right-4 top-12 w-[calc(100vw-2rem)] max-w-64 max-h-[calc(100svh-5rem)] bg-bg-secondary border border-border-default rounded-xl shadow-2xl shadow-black/40 z-50 overflow-y-auto overflow-x-hidden" ref={mobilePaletteRef}>
              <ColorPalette />
            </div>
          )}
          {showCheckpoints && (
            <div className="absolute right-4 top-12 w-[calc(100vw-2rem)] max-w-80 max-h-[calc(100svh-5rem)] bg-bg-secondary border border-border-default rounded-xl shadow-2xl shadow-black/40 z-50 overflow-y-auto overflow-x-hidden" ref={mobileCheckpointRef}>
              <Checkpoints />
            </div>
          )}
        </div>
      </header>

      <ConfirmModal
        open={showDiscardModal}
        title={t('editor.discardTitle')}
        message={t('editor.discardMessage')}
        confirmLabel={t('common.discard')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDiscard}
        onCancel={() => setShowDiscardModal(false)}
      />
    </>
  )
}

import { useState, useRef, useEffect } from 'react'
import { Home, ImageIcon, History, RotateCcw } from 'lucide-react'
import { useProjectActions } from '@/hooks/useProjectActions'
import { useProjectImages } from '@/hooks/useProjectImages'
import { useCheckpoints } from '@/hooks/useCheckpoints'
import { usePanelSizes } from '@/hooks/usePanelSizes'
import ViewToggle from '@/components/layout/ViewToggle'
import DeviceToggle from '@/components/layout/DeviceToggle'
import ExportButton from '@/components/layout/ExportButton'
import BuildDownloadButton from '@/components/layout/BuildDownloadButton'
import PublishButton from '@/components/layout/PublishButton'
import ProjectName from '@/components/layout/ProjectName'
import ImageAssets from '@/components/layout/ImageAssets'
import Checkpoints from '@/components/layout/Checkpoints'

export default function EditorHeader() {
  const { goHome } = useProjectActions()
  const { images } = useProjectImages()
  const { checkpoints } = useCheckpoints()
  const { resetPanels } = usePanelSizes()
  const [showImages, setShowImages] = useState(false)
  const [showCheckpoints, setShowCheckpoints] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const checkpointRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showImages && !showCheckpoints) return
    function handleClick(e: MouseEvent) {
      if (showImages && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowImages(false)
      }
      if (showCheckpoints && checkpointRef.current && !checkpointRef.current.contains(e.target as Node)) {
        setShowCheckpoints(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showImages, showCheckpoints])

  return (
    <header className="h-11 border-b border-border-subtle flex items-center justify-between px-4 shrink-0 bg-bg-secondary">
      <div className="flex items-center gap-3">
        <button
          onClick={goHome}
          className="p-1.5 rounded-lg text-forge-terracotta/60 hover:text-forge-terracotta hover:bg-forge-terracotta/10 transition cursor-pointer"
          title="Voltar para projetos"
        >
          <Home size={15} />
        </button>
        <div className="w-px h-4 bg-border-subtle" />
        <ProjectName />
      </div>
      <div className="flex items-center gap-3">
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowImages(!showImages)}
            className="flex items-center gap-1.5 p-1.5 rounded-lg text-forge-terracotta/60 hover:text-forge-terracotta hover:bg-forge-terracotta/10 transition cursor-pointer"
            title="Imagens do projeto"
          >
            <ImageIcon size={15} />
            {images.length > 0 && (
              <span className="text-[10px] text-text-secondary">{images.length}</span>
            )}
          </button>
          {showImages && (
            <div className="absolute right-0 top-full mt-1 w-72 bg-bg-secondary border border-border-default rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
              <ImageAssets />
            </div>
          )}
        </div>
        <div className="relative" ref={checkpointRef}>
          <button
            onClick={() => setShowCheckpoints(!showCheckpoints)}
            className="flex items-center gap-1.5 p-1.5 rounded-lg text-forge-terracotta/60 hover:text-forge-terracotta hover:bg-forge-terracotta/10 transition cursor-pointer"
            title="Checkpoints"
          >
            <History size={15} />
            {checkpoints.length > 0 && (
              <span className="text-[10px] text-text-secondary">{checkpoints.length}</span>
            )}
          </button>
          {showCheckpoints && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-bg-secondary border border-border-default rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
              <Checkpoints />
            </div>
          )}
        </div>
        <DeviceToggle />
        <ViewToggle />
        <button
          onClick={resetPanels}
          className="group relative p-1.5 rounded-lg text-forge-terracotta/60 hover:text-forge-terracotta hover:bg-forge-terracotta/10 transition cursor-pointer"
        >
          <RotateCcw size={14} />
          <span className="pointer-events-none absolute top-full right-0 mt-1.5 px-2 py-1 rounded-md bg-bg-elevated border border-border-subtle text-[10px] text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-lg z-50">
            Resetar painéis
          </span>
        </button>
        <ExportButton />
        <BuildDownloadButton />
        <PublishButton />
      </div>
    </header>
  )
}

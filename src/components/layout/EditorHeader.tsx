import { useState, useRef, useEffect } from 'react'
import { Home, ImageIcon, History } from 'lucide-react'
import { useProjectActions } from '@/hooks/useProjectActions'
import { useProjectImages } from '@/hooks/useProjectImages'
import { useCheckpoints } from '@/hooks/useCheckpoints'
import ViewToggle from '@/components/layout/ViewToggle'
import DeviceToggle from '@/components/layout/DeviceToggle'
import ExportButton from '@/components/layout/ExportButton'
import ProjectName from '@/components/layout/ProjectName'
import ImageAssets from '@/components/layout/ImageAssets'
import Checkpoints from '@/components/layout/Checkpoints'

export default function EditorHeader() {
  const { goHome } = useProjectActions()
  const { images } = useProjectImages()
  const { checkpoints } = useCheckpoints()
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
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
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
            className="flex items-center gap-1.5 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
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
            className="flex items-center gap-1.5 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
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
        <ExportButton />
      </div>
    </header>
  )
}

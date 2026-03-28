import { useState, useRef, useEffect } from 'react'
import { Home, ImageIcon } from 'lucide-react'
import { useProjectActions } from '@/hooks/useProjectActions'
import { useProjectImages } from '@/hooks/useProjectImages'
import ViewToggle from '@/components/layout/ViewToggle'
import DeviceToggle from '@/components/layout/DeviceToggle'
import ExportButton from '@/components/layout/ExportButton'
import ProjectName from '@/components/layout/ProjectName'
import ImageAssets from '@/components/layout/ImageAssets'

export default function EditorHeader() {
  const { goHome } = useProjectActions()
  const { images } = useProjectImages()
  const [showImages, setShowImages] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showImages) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowImages(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showImages])

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
        <DeviceToggle />
        <ViewToggle />
        <ExportButton />
      </div>
    </header>
  )
}

import { memo, useCallback, useRef, useState } from 'react'
import { SandpackLayout, SandpackFileExplorer, SandpackCodeEditor, SandpackPreview } from '@codesandbox/sandpack-react'
import { Save, Undo2, Search } from 'lucide-react'
import FindInFiles from './FindInFiles'
import { type DevicePreview } from '@/atoms'
import { useViewMode } from '@/hooks/useViewMode'
import { useDevicePreview } from '@/hooks/useDevicePreview'
import { useSandpackSync } from '@/hooks/useSandpackSync'
import { useEditorState } from '@/hooks/useEditorState'
import { usePanelSizes } from '@/hooks/usePanelSizes'
import ResizeHandle from '@/components/layout/ResizeHandle'

const DEVICE_WIDTHS: Record<DevicePreview, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

const SPLIT_MIN = 0.2
const SPLIT_MAX = 0.8

// Isolated component — absorbs re-renders from useSandpack() context
const SandpackSyncBridge = memo(function SandpackSyncBridge() {
  useSandpackSync()
  return null
})

function EditBar({ onSave, onDiscard }: { onSave: () => void; onDiscard: () => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-forge-terracotta/10 border-b border-forge-terracotta/20 shrink-0">
      <span className="text-[11px] font-medium text-forge-terracotta">Editando manualmente</span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onDiscard}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
        >
          <Undo2 size={13} />
          Descartar
        </button>
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-accent/15 text-accent hover:bg-accent/25 transition cursor-pointer"
        >
          <Save size={13} />
          Salvar
        </button>
      </div>
    </div>
  )
}

export default function SandpackContent() {
  const { isDirty, saveEdits, discardEdits } = useEditorState()
  const { editorFraction, setEditorFraction } = usePanelSizes()
  const { showEditor, showPreview, isSplit } = useViewMode()
  const { device } = useDevicePreview()
  const containerRef = useRef<HTMLDivElement>(null)
  const [findOpen, setFindOpen] = useState(false)

  const isResponsive = device !== 'desktop'

  const editorFractionRef = useRef(editorFraction)
  editorFractionRef.current = editorFraction
  const editorPanelRef = useRef<HTMLDivElement>(null)
  const previewPanelRef = useRef<HTMLDivElement>(null)

  const onSplitResize = useCallback((delta: number) => {
    const container = containerRef.current
    if (!container) return
    const totalWidth = container.offsetWidth
    if (totalWidth === 0) return
    const next = Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, editorFractionRef.current + delta / totalWidth))
    editorFractionRef.current = next
    if (editorPanelRef.current) editorPanelRef.current.style.width = `${next * 100}%`
    if (previewPanelRef.current) previewPanelRef.current.style.width = `${(1 - next) * 100}%`
  }, [])

  const onSplitCommit = useCallback(() => {
    setEditorFraction(editorFractionRef.current)
  }, [setEditorFraction])

  return (
    <SandpackLayout ref={containerRef} className="flex h-full w-full">
      <SandpackSyncBridge />
      <div
        ref={editorPanelRef}
        className={showEditor ? 'flex flex-col min-w-0 h-full' : 'hidden'}
        style={isSplit ? { width: `${editorFraction * 100}%` } : { flex: 1 }}
      >
        {isDirty && <EditBar onSave={saveEdits} onDiscard={discardEdits} />}
        <div className="relative flex flex-1 min-h-0">
          <SandpackFileExplorer />
          <SandpackCodeEditor
            showTabs
            closableTabs
            showLineNumbers
            showInlineErrors
          />
          <button
            onClick={() => setFindOpen((v) => !v)}
            className="absolute top-1.5 right-2 z-10 p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
            title="Buscar em arquivos (Ctrl+Shift+F)"
          >
            <Search size={13} />
          </button>
          <FindInFiles open={findOpen} onClose={() => setFindOpen(false)} />
        </div>
      </div>
      {isSplit && <ResizeHandle onResize={onSplitResize} onCommit={onSplitCommit} />}
      <div
        ref={previewPanelRef}
        className={
          showPreview
            ? 'relative min-w-0 h-full flex items-start justify-center overflow-auto'
            : 'absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none'
        }
        style={isSplit ? { width: `${(1 - editorFraction) * 100}%` } : showPreview ? { flex: 1 } : undefined}
      >
        <div
          className={`relative ${isResponsive
            ? 'h-full border-x border-border-subtle transition-all duration-300 shrink-0 my-0 mx-auto'
            : 'w-full h-full'
          }`}
          style={isResponsive ? { width: DEVICE_WIDTHS[device] } : undefined}
        >
          <SandpackPreview
            showNavigator
            showRefreshButton
            showOpenInCodeSandbox={false}
          />
        </div>
      </div>
    </SandpackLayout>
  )
}

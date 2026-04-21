import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { SandpackLayout, SandpackFileExplorer, SandpackCodeEditor, SandpackPreview } from '@codesandbox/sandpack-react'
import { Search, PanelLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import FindInFiles from './FindInFiles'
import { type DevicePreview } from '@/atoms'
import { useViewMode } from '@/hooks/useViewMode'
import { useDevicePreview } from '@/hooks/useDevicePreview'
import { useSandpackSync } from '@/hooks/useSandpackSync'
import { useInspectBridge } from '@/hooks/useInspectBridge'
import { useEditorState } from '@/hooks/useEditorState'
import { usePanelSizes } from '@/hooks/usePanelSizes'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useEditorPanelTabs } from '@/hooks/useEditorPanelTabs'
import ResizeHandle from '@/components/layout/ResizeHandle'
import EditBar from './EditBar'
import EditorPanelTabs from './EditorPanelTabs'
import StyleEditor from './StyleEditor'
import LayersPanel from './LayersPanel'
import SelectionOverlay from './SelectionOverlay'

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
  useInspectBridge()
  return null
})

export default function SandpackContent() {
  const { isDirty, saveEdits, discardEdits } = useEditorState()
  const { editorFraction, setEditorFraction } = usePanelSizes()
  const { showEditor, showPreview, isSplit } = useViewMode()
  const { device } = useDevicePreview()
  const isMobile = useIsMobile()
  const { t } = useTranslation()
  const { editorPanelMode, inspectMode } = useEditorPanelTabs()
  const containerRef = useRef<HTMLDivElement>(null)
  const [findOpen, setFindOpen] = useState(false)
  const [showExplorer, setShowExplorer] = useState(!isMobile)

  const isResponsive = device !== 'desktop'

  const editorFractionRef = useRef(editorFraction)
  useLayoutEffect(() => { editorFractionRef.current = editorFraction }, [editorFraction])
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
        <EditorPanelTabs />
        {/* Code editor — always mounted to avoid expensive Monaco re-initialization */}
        <div className={editorPanelMode === 'code' ? 'flex flex-col flex-1 min-h-0' : 'hidden'}>
          <div className="flex items-center justify-end gap-1 px-2 py-1 border-b border-border-subtle shrink-0 bg-bg-secondary">
            <button
              onClick={() => setShowExplorer((v) => !v)}
              className={`p-1.5 rounded-md transition cursor-pointer ${showExplorer ? 'text-text-primary bg-bg-elevated' : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'}`}
              title={t('editor.files')}
            >
              <PanelLeft size={13} />
            </button>
            <button
              onClick={() => setFindOpen((v) => !v)}
              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
              title={t('editor.findInFilesTooltip')}
            >
              <Search size={13} />
            </button>
          </div>
          <div className="relative flex flex-1 min-h-0">
            {showExplorer && <SandpackFileExplorer />}
            <SandpackCodeEditor
              showTabs
              closableTabs
              showLineNumbers
              showInlineErrors
            />
            <FindInFiles key={String(findOpen)} open={findOpen} onClose={() => setFindOpen(false)} />
          </div>
        </div>
        {editorPanelMode === 'style' && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <StyleEditor />
          </div>
        )}
        {editorPanelMode === 'layers' && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <LayersPanel />
          </div>
        )}
      </div>
      {isSplit && <ResizeHandle onResize={onSplitResize} onCommit={onSplitCommit} />}
      <div
        ref={previewPanelRef}
        className={
          showPreview
            ? `relative min-w-0 h-full flex items-start justify-center overflow-auto${inspectMode ? ' cursor-crosshair ring-1 ring-inset ring-forge-terracotta/20' : ''}`
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
          <SelectionOverlay />
        </div>
      </div>
    </SandpackLayout>
  )
}

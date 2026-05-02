import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { SandpackLayout, SandpackFileExplorer, SandpackCodeEditor, SandpackPreview } from '@codesandbox/sandpack-react';
import { Search, PanelLeft, FilePlus, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FindInFiles from './FindInFiles';
import { type DevicePreview } from '@/atoms';
import { useViewMode } from '@/hooks/useViewMode';
import { useDevicePreview } from '@/hooks/useDevicePreview';
import { useSandpackSync } from '@/hooks/useSandpackSync';
import { useInspectBridge } from '@/hooks/useInspectBridge';
import { usePanelSizes } from '@/hooks/usePanelSizes';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useEditorPanelTabs } from '@/hooks/useEditorPanelTabs';
import { useMobileDrawer } from '@/hooks/useMobileDrawer';
import { useBlockDropZone } from '@/hooks/useBlockDropZone';
import { useNewFile } from '@/hooks/useNewFile';
import ResizeHandle from './ResizeHandle';
import EditorPanelTabs from './EditorPanelTabs';
import StyleEditor from './StyleEditor';
import LayersPanel from './LayersPanel';
import BlockLibraryPanel from './BlockLibraryPanel';
import BlockDropOverlay from './BlockDropOverlay';
import { MobileChatPanel } from '@/components/chat/FloatingChat';

const DEVICE_WIDTHS: Record<DevicePreview, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

const SPLIT_MIN = 0.2;
const SPLIT_MAX = 0.8;
const DRAWER_MIN = 20;
const DRAWER_MAX = 80;

// Isolated component — absorbs re-renders from useSandpack() context
const SandpackSyncBridge = memo(function SandpackSyncBridge() {
  useSandpackSync();
  useInspectBridge();
  return null;
});

export default function SandpackContent() {
  const { editorFraction, setEditorFraction } = usePanelSizes();
  const { showEditor, showPreview, isSplit } = useViewMode();
  const { device } = useDevicePreview();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { editorPanelMode, inspectMode } = useEditorPanelTabs();
  const { drawerOpen, drawerHeightPct, setDrawerHeightPct, drawerTab } = useMobileDrawer();
  const { isDragging, handleDrop, handleDragOver } = useBlockDropZone();
  const { isCreating, fileName, setFileName, inputRef, startCreate, cancelCreate, confirmCreate, handleKeyDown } =
    useNewFile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [findOpen, setFindOpen] = useState(false);
  const [showExplorer, setShowExplorer] = useState(!isMobile);

  const isResponsive = device !== 'desktop';

  // ── Desktop split resize ──────────────────────────────────────────────────

  const editorFractionRef = useRef(editorFraction);
  useLayoutEffect(() => {
    editorFractionRef.current = editorFraction;
  }, [editorFraction]);
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);

  const onSplitResize = useCallback((delta: number) => {
    const container = containerRef.current;
    if (!container) return;
    const totalWidth = container.offsetWidth;
    if (totalWidth === 0) return;
    const next = Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, editorFractionRef.current + delta / totalWidth));
    editorFractionRef.current = next;
    if (editorPanelRef.current) editorPanelRef.current.style.width = `${next * 100}%`;
    if (previewPanelRef.current) previewPanelRef.current.style.width = `${(1 - next) * 100}%`;
  }, []);

  const onSplitCommit = useCallback(() => {
    setEditorFraction(editorFractionRef.current);
  }, [setEditorFraction]);

  // ── Mobile drawer drag resize ─────────────────────────────────────────────

  const drawerHeightPctRef = useRef(drawerHeightPct);
  useLayoutEffect(() => {
    drawerHeightPctRef.current = drawerHeightPct;
  }, [drawerHeightPct]);
  const drawerRef = useRef<HTMLDivElement>(null);

  const onDrawerDragStart = useCallback(
    (e: React.PointerEvent) => {
      const startY = e.clientY;
      const startH = drawerHeightPctRef.current;

      const onMove = (ev: PointerEvent) => {
        const containerH = containerRef.current?.offsetHeight ?? 1;
        const delta = startY - ev.clientY;
        const next = Math.min(DRAWER_MAX, Math.max(DRAWER_MIN, startH + (delta / containerH) * 100));
        drawerHeightPctRef.current = next;
        if (drawerRef.current) drawerRef.current.style.height = `${next}%`;
      };

      const onUp = () => {
        setDrawerHeightPct(Math.round(drawerHeightPctRef.current));
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [setDrawerHeightPct],
  );

  return (
    <SandpackLayout ref={containerRef} className="flex h-full w-full">
      <SandpackSyncBridge />

      {/* Mobile: preview always full size, drawer overlays from bottom */}
      {isMobile ?
        <div className="relative flex flex-1 min-w-0 h-full">
          {/* Preview — always full height, never resized by drawer */}
          <div
            className={`absolute inset-0 flex items-start justify-center overflow-auto${inspectMode ? ' cursor-crosshair ring-1 ring-inset ring-forge-terracotta/20' : ''}`}
          >
            <div
              className={`relative ${isResponsive ? 'h-full border-x border-border-subtle transition-all duration-300 shrink-0 my-0 mx-auto' : 'w-full h-full'}`}
              style={isResponsive ? { width: DEVICE_WIDTHS[device] } : undefined}
            >
              <SandpackPreview showRefreshButton showOpenInCodeSandbox={false} />
              {isDragging && <BlockDropOverlay onDrop={handleDrop} onDragOver={handleDragOver} />}
            </div>
          </div>

          {/* Drawer — absolute overlay from bottom, slides in/out */}
          <div
            ref={drawerRef}
            className={`absolute bottom-0 left-0 right-0 z-20 flex flex-col bg-bg-secondary border-t border-border-subtle overflow-hidden transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}
            style={{ height: `${drawerHeightPct}%` }}
          >
            {/* Drag handle */}
            <div
              className="flex shrink-0 touch-none cursor-row-resize justify-center py-2"
              onPointerDown={onDrawerDragStart}
            >
              <div className="h-1 w-10 rounded-full bg-border-default" />
            </div>

            {drawerTab === 'chat' ?
              <div className="flex-1 min-h-0 overflow-hidden">
                <MobileChatPanel />
              </div>
            : <>
                <EditorPanelTabs />
                <div className={editorPanelMode === 'code' ? 'flex flex-col flex-1 min-h-0' : 'hidden'}>
                  <div className="flex items-center justify-end gap-1 px-2 py-1 border-b border-border-subtle shrink-0 bg-bg-secondary">
                    <button
                      onClick={() => setFindOpen((v) => !v)}
                      className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
                      title={t('editor.findInFilesTooltip')}
                    >
                      <Search size={13} />
                    </button>
                  </div>
                  <div className="relative flex flex-1 min-h-0">
                    <SandpackCodeEditor showTabs closableTabs showLineNumbers showInlineErrors />
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
                {editorPanelMode === 'blocks' && (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <BlockLibraryPanel />
                  </div>
                )}
              </>
            }
          </div>
        </div>
      : /* Desktop: preview + resize handle + editor as horizontal flex siblings */
        <>
          <div
            ref={editorPanelRef}
            className={showEditor ? 'flex flex-col min-w-0 h-full' : 'hidden'}
            style={isSplit ? { width: `${editorFraction * 100}%` } : { flex: 1 }}
          >
            <EditorPanelTabs />
            <div className={editorPanelMode === 'code' ? 'flex flex-col flex-1 min-h-0' : 'hidden'}>
              <div className="flex items-center gap-1 px-2 py-1 border-b border-border-subtle shrink-0 bg-bg-secondary">
                {isCreating ?
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <input
                      ref={inputRef}
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t('editor.newFilePlaceholder')}
                      className="flex-1 min-w-0 text-xs bg-bg-elevated border border-border-subtle rounded px-2 py-0.5 text-text-primary placeholder-text-muted outline-none focus:border-forge-terracotta/60"
                    />
                    <button
                      onClick={confirmCreate}
                      className="p-1 rounded text-green-400 hover:bg-bg-elevated transition cursor-pointer shrink-0"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={cancelCreate}
                      className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                : <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={startCreate}
                      className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
                      title={t('editor.newFileTooltip')}
                    >
                      <FilePlus size={13} />
                    </button>
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
                }
              </div>
              <div className="relative flex flex-1 min-h-0">
                {showExplorer && <SandpackFileExplorer />}
                <SandpackCodeEditor showTabs closableTabs showLineNumbers showInlineErrors />
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
            {editorPanelMode === 'blocks' && (
              <div className="flex-1 min-h-0 overflow-hidden">
                <BlockLibraryPanel />
              </div>
            )}
          </div>

          {isSplit && <ResizeHandle onResize={onSplitResize} onCommit={onSplitCommit} />}

          <div
            ref={previewPanelRef}
            className={
              showPreview ?
                `relative min-w-0 h-full flex items-start justify-center overflow-auto${inspectMode ? ' cursor-crosshair ring-1 ring-inset ring-forge-terracotta/20' : ''}`
              : 'absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none'
            }
            style={isSplit ? { width: `${(1 - editorFraction) * 100}%` } : { flex: 1 }}
          >
            <div
              className={`relative ${isResponsive ? 'h-full border-x border-border-subtle transition-all duration-300 shrink-0 my-0 mx-auto' : 'w-full h-full'}`}
              style={isResponsive ? { width: DEVICE_WIDTHS[device] } : undefined}
            >
              <SandpackPreview showRefreshButton showOpenInCodeSandbox={false} />
              {isDragging && <BlockDropOverlay onDrop={handleDrop} onDragOver={handleDragOver} />}
            </div>
          </div>
        </>
      }
    </SandpackLayout>
  );
}

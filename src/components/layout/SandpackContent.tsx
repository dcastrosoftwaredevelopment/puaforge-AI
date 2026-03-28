import { useCallback, useRef, useState } from 'react'
import { SandpackLayout, SandpackFileExplorer, SandpackCodeEditor, SandpackPreview } from '@codesandbox/sandpack-react'
import { type DevicePreview } from '@/atoms'
import { useViewMode } from '@/hooks/useViewMode'
import { useDevicePreview } from '@/hooks/useDevicePreview'
import { useSandpackSync } from '@/hooks/useSandpackSync'
import ResizeHandle from '@/components/layout/ResizeHandle'

const DEVICE_WIDTHS: Record<DevicePreview, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

const SPLIT_MIN = 0.2 // 20% minimum for each panel
const SPLIT_MAX = 0.8

export default function SandpackContent() {
  useSandpackSync()
  const { showEditor, showPreview, isSplit } = useViewMode()
  const { device } = useDevicePreview()
  const containerRef = useRef<HTMLDivElement>(null)
  const [editorFraction, setEditorFraction] = useState(0.5)

  const isResponsive = device !== 'desktop'

  const onSplitResize = useCallback((delta: number) => {
    const container = containerRef.current
    if (!container) return
    const totalWidth = container.offsetWidth
    if (totalWidth === 0) return
    setEditorFraction((prev) => Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, prev + delta / totalWidth)))
  }, [])

  return (
    <SandpackLayout ref={containerRef} className="flex h-full w-full">
      <div
        className={showEditor ? 'flex min-w-0 h-full' : 'hidden'}
        style={isSplit ? { width: `${editorFraction * 100}%` } : { flex: 1 }}
      >
        <SandpackFileExplorer />
        <SandpackCodeEditor
          showTabs
          showLineNumbers
          showInlineErrors
          readOnly
        />
      </div>
      {isSplit && <ResizeHandle onResize={onSplitResize} />}
      <div
        className={
          showPreview
            ? 'relative min-w-0 h-full flex items-start justify-center overflow-auto'
            : 'absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none'
        }
        style={isSplit ? { width: `${(1 - editorFraction) * 100}%` } : showPreview ? { flex: 1 } : undefined}
      >
        <div
          className={isResponsive
            ? 'h-full border-x border-border-subtle transition-all duration-300 shrink-0 my-0 mx-auto'
            : 'w-full h-full'
          }
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

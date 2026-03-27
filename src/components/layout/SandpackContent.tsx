import { useAtomValue } from 'jotai'
import { SandpackLayout, SandpackFileExplorer, SandpackCodeEditor, SandpackPreview } from '@codesandbox/sandpack-react'
import { viewModeAtom, devicePreviewAtom, type DevicePreview } from '@/atoms'
import { useSandpackSync } from '@/hooks/useSandpackSync'

const DEVICE_WIDTHS: Record<DevicePreview, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

export default function SandpackContent() {
  useSandpackSync()
  const viewMode = useAtomValue(viewModeAtom)
  const device = useAtomValue(devicePreviewAtom)

  const showEditor = viewMode === 'editor' || viewMode === 'split'
  const showPreview = viewMode === 'preview' || viewMode === 'split'
  const isResponsive = device !== 'desktop'

  return (
    <SandpackLayout className="flex h-full w-full">
      <div className={showEditor ? 'flex flex-1 min-w-0 h-full' : 'hidden'}>
        <SandpackFileExplorer />
        <SandpackCodeEditor
          showTabs
          showLineNumbers
          showInlineErrors
          readOnly
        />
      </div>
      <div className={
        showPreview
          ? 'relative flex-1 min-w-0 h-full flex items-start justify-center overflow-auto'
          : 'absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none'
      }>
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

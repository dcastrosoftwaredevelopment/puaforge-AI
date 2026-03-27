import { useAtomValue } from 'jotai'
import { SandpackLayout, SandpackFileExplorer, SandpackCodeEditor, SandpackPreview } from '@codesandbox/sandpack-react'
import { viewModeAtom } from '@/atoms'
import { useSandpackSync } from '@/hooks/useSandpackSync'

export default function SandpackContent() {
  useSandpackSync()
  const viewMode = useAtomValue(viewModeAtom)

  const showEditor = viewMode === 'editor' || viewMode === 'split'
  const showPreview = viewMode === 'preview' || viewMode === 'split'

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
          ? 'relative flex-1 min-w-0 h-full'
          : 'absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none'
      }>
        <SandpackPreview
          showNavigator
          showRefreshButton
        />
      </div>
    </SandpackLayout>
  )
}

import { useParams } from 'react-router-dom'
import { SandpackProvider } from '@codesandbox/sandpack-react'
import { useAtomValue } from 'jotai'
import { Loader2 } from 'lucide-react'
import { chatModeAtom } from '@/atoms'
import { useFiles } from '@/hooks/useFiles'
import { useProjectLoader } from '@/hooks/useProjectLoader'
import { TAILWIND_HTML } from '@/utils/defaultFiles'
import EditorHeader from '@/components/layout/EditorHeader'
import SandpackContent from '@/components/layout/SandpackContent'
import FloatingChat, { DockedChat } from '@/components/chat/FloatingChat'

export default function EditorView() {
  const { projectId } = useParams<{ projectId: string }>()
  const projectReady = useProjectLoader(projectId)
  const { files, deps } = useFiles()
  const chatMode = useAtomValue(chatModeAtom)

  // Forces SandpackProvider remount on any file or dependency change
  const filesHash = Object.entries(files)
    .map(([p, c]) => `${p}:${c.length}`)
    .sort()
    .join('|')
  const depsKey = Object.keys(deps).sort().join(',')
  const sandpackKey = `${projectId}-${filesHash}-${depsKey}`

  if (!projectReady) {
    return (
      <div className="h-screen w-screen bg-bg-primary flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-bg-primary flex flex-col">
      <EditorHeader />

      <div className="flex-1 overflow-hidden flex">
        <main className="flex-1 min-w-0">
          <SandpackProvider
            key={sandpackKey}
            files={{ '/index.html': TAILWIND_HTML, ...files }}
            theme="dark"
            template="react-ts"
            customSetup={{
              dependencies: deps,
            }}
            options={{
              activeFile: '/App.tsx',
              externalResources: ['https://cdn.tailwindcss.com'],
            }}
          >
            <SandpackContent />
          </SandpackProvider>
        </main>

        {chatMode === 'docked' && <DockedChat />}
      </div>

      <FloatingChat />
    </div>
  )
}

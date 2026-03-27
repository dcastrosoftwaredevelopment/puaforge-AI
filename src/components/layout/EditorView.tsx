import { SandpackProvider } from '@codesandbox/sandpack-react'
import { Home } from 'lucide-react'
import { useFiles } from '@/hooks/useFiles'
import { TAILWIND_HTML } from '@/utils/defaultFiles'
import { useProjectActions } from '@/hooks/useProjectActions'
import ViewToggle from '@/components/layout/ViewToggle'
import DeviceToggle from '@/components/layout/DeviceToggle'
import ExportButton from '@/components/layout/ExportButton'
import ProjectName from '@/components/layout/ProjectName'
import SandpackContent from '@/components/layout/SandpackContent'
import FloatingChat from '@/components/chat/FloatingChat'

export default function EditorView() {
  const { goHome } = useProjectActions()
  const { files, deps } = useFiles()
  const depsKey = Object.keys(deps).sort().join(',')

  return (
    <div className="h-screen w-screen bg-bg-primary flex flex-col">
      <header className="h-11 border-b border-border-subtle flex items-center justify-between px-4 shrink-0 bg-bg-secondary">
        <div className="flex items-center gap-3">
          <button
            onClick={goHome}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition"
            title="Voltar para projetos"
          >
            <Home size={15} />
          </button>
          <div className="w-px h-4 bg-border-subtle" />
          <ProjectName />
        </div>
        <div className="flex items-center gap-3">
          <DeviceToggle />
          <ViewToggle />
          <ExportButton />
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <SandpackProvider
          key={depsKey}
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

      <FloatingChat />
    </div>
  )
}

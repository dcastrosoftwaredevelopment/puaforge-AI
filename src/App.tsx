import { useAtomValue, useAtom } from 'jotai'
import { SandpackProvider, SandpackLayout, SandpackFileExplorer } from '@codesandbox/sandpack-react'
import { Code, Eye, Columns } from 'lucide-react'
import { filesAtom, viewModeAtom } from '@/atoms'
import EditorPanel from '@/components/editor/EditorPanel'
import PreviewPanel from '@/components/preview/PreviewPanel'
import FloatingChat from '@/components/chat/FloatingChat'

type ViewMode = 'editor' | 'preview' | 'split'

function ViewToggle() {
  const [viewMode, setViewMode] = useAtom(viewModeAtom)

  const modes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'preview', icon: <Eye size={14} />, label: 'Preview' },
    { mode: 'split', icon: <Columns size={14} />, label: 'Split' },
    { mode: 'editor', icon: <Code size={14} />, label: 'Code' },
  ]

  return (
    <div className="flex items-center gap-0.5 bg-bg-tertiary rounded-lg p-0.5 border border-border-subtle">
      {modes.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            viewMode === mode
              ? 'bg-bg-elevated text-text-primary shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const files = useAtomValue(filesAtom)
  const viewMode = useAtomValue(viewModeAtom)

  const showEditor = viewMode === 'editor' || viewMode === 'split'
  const showPreview = viewMode === 'preview' || viewMode === 'split'

  return (
    <div className="h-screen w-screen bg-bg-primary flex flex-col">
      {/* Top bar */}
      <header className="h-11 border-b border-border-subtle flex items-center justify-between px-4 shrink-0 bg-bg-secondary">
        <span className="text-sm font-semibold text-text-primary tracking-tight">
          vibe<span className="text-accent">.</span>platform
        </span>
        <ViewToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <SandpackProvider
          files={files}
          theme="dark"
          template="react"
          options={{
            externalResources: ['https://cdn.tailwindcss.com'],
          }}
        >
          <SandpackLayout style={{ height: '100%', border: 'none', borderRadius: 0, background: 'transparent' }}>
            {showEditor && (
              <>
                <SandpackFileExplorer style={{ height: '100%' }} />
                <EditorPanel />
              </>
            )}
            {showPreview && <PreviewPanel />}
          </SandpackLayout>
        </SandpackProvider>
      </main>

      {/* Floating chat overlay */}
      <FloatingChat />
    </div>
  )
}

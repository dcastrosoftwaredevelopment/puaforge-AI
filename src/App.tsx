import { useAtom, useAtomValue } from 'jotai'
import { SandpackProvider, SandpackLayout, SandpackFileExplorer, SandpackCodeEditor, SandpackPreview } from '@codesandbox/sandpack-react'
import { Code, Eye, Columns, Loader2 } from 'lucide-react'
import { filesAtom, viewModeAtom } from '@/atoms'
import { usePersistence } from '@/hooks/usePersistence'
import { useSandpackSync } from '@/hooks/useSandpackSync'
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

function SandpackContent() {
  useSandpackSync()
  const viewMode = useAtomValue(viewModeAtom)

  const showEditor = viewMode === 'editor' || viewMode === 'split'
  const showPreview = viewMode === 'preview' || viewMode === 'split'

  return (
    <SandpackLayout style={{ display: 'flex', height: '100%', width: '100%', flexWrap: 'nowrap' }}>
      <div style={{
        display: showEditor ? 'flex' : 'none',
        flex: 1,
        minWidth: 0,
        height: '100%',
      }}>
        <SandpackFileExplorer style={{ height: '100%' }} />
        <SandpackCodeEditor
          showTabs
          showLineNumbers
          showInlineErrors
          readOnly
          style={{ height: '100%', flex: 1 }}
        />
      </div>
      <div style={{
        position: showPreview ? 'relative' : 'absolute',
        flex: showPreview ? 1 : undefined,
        width: showPreview ? undefined : 0,
        height: showPreview ? '100%' : 0,
        overflow: showPreview ? 'visible' : 'hidden',
        minWidth: 0,
        opacity: showPreview ? 1 : 0,
        pointerEvents: showPreview ? 'auto' : 'none',
      }}>
        <SandpackPreview
          showNavigator
          showRefreshButton
          style={{ height: '100%' }}
        />
      </div>
    </SandpackLayout>
  )
}

export default function App() {
  const { isHydrated } = usePersistence()
  const files = useAtomValue(filesAtom)

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
        {isHydrated ? (
          <SandpackProvider
            files={files}
            theme="dark"
            template="react"
            options={{
              externalResources: ['https://cdn.tailwindcss.com'],
            }}
          >
            <SandpackContent />
          </SandpackProvider>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 size={24} className="animate-spin text-text-muted" />
            <span className="text-text-muted text-sm">Carregando projeto...</span>
          </div>
        )}
      </main>

      {/* Floating chat overlay */}
      <FloatingChat />
    </div>
  )
}

import { useAtomValue } from 'jotai'
import { SandpackProvider } from '@codesandbox/sandpack-react'
import { Loader2 } from 'lucide-react'
import { filesAtom } from '@/atoms'
import { usePersistence } from '@/hooks/usePersistence'
import ViewToggle from '@/components/layout/ViewToggle'
import SandpackContent from '@/components/layout/SandpackContent'
import FloatingChat from '@/components/chat/FloatingChat'

export default function App() {
  const { isHydrated } = usePersistence()
  const files = useAtomValue(filesAtom)

  return (
    <div className="h-screen w-screen bg-bg-primary flex flex-col">
      <header className="h-11 border-b border-border-subtle flex items-center justify-between px-4 shrink-0 bg-bg-secondary">
        <span className="text-sm font-semibold text-text-primary tracking-tight">
          vibe<span className="text-accent">.</span>platform
        </span>
        <ViewToggle />
      </header>

      <main className="flex-1 overflow-hidden">
        {isHydrated ? (
          <SandpackProvider
            files={files}
            theme="dark"
            template="react-ts"
            options={{
              activeFile: '/App.tsx',
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

      <FloatingChat />
    </div>
  )
}

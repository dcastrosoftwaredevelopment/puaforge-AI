import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { SandpackProvider } from '@codesandbox/sandpack-react'
import { Loader2, MessageCircle } from 'lucide-react'
import { useFiles } from '@/hooks/useFiles'
import { useChat } from '@/hooks/useChat'
import { usePanelSizes } from '@/hooks/usePanelSizes'
import { useProjectLoader } from '@/hooks/useProjectLoader'
import { TAILWIND_HTML } from '@/utils/defaultFiles'
import EditorHeader from '@/components/layout/EditorHeader'
import SandpackContent from '@/components/layout/SandpackContent'
import ResizeHandle from '@/components/layout/ResizeHandle'
import FloatingChat, { DockedChat } from '@/components/chat/FloatingChat'

const CHAT_MIN = 280
const CHAT_MAX = 600

export default function EditorView() {
  const { projectId } = useParams<{ projectId: string }>()
  const projectReady = useProjectLoader(projectId)
  const { files, deps } = useFiles()
  const { mode: chatMode, isOpen: isChatOpen, setIsOpen: setIsChatOpen } = useChat()
  const { chatWidth, setChatWidth } = usePanelSizes()

  const isDocked = chatMode === 'docked'
  const showDockedChat = isDocked && isChatOpen

  const onChatResize = useCallback((delta: number) => {
    setChatWidth((prev) => Math.min(CHAT_MAX, Math.max(CHAT_MIN, prev - delta)))
  }, [setChatWidth])

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

        {isDocked && !isChatOpen && (
          <div className="shrink-0 w-8 relative border-l border-border-subtle bg-bg-secondary">
            <button
              onClick={() => setIsChatOpen(true)}
              className="absolute bottom-4 left-0 right-0 mx-auto w-7 h-7 flex items-center justify-center rounded-lg bg-forge-terracotta/10 hover:bg-forge-terracotta/20 text-forge-terracotta border border-forge-terracotta/20 transition cursor-pointer"
              title="Abrir chat"
            >
              <MessageCircle size={13} />
            </button>
          </div>
        )}
        {showDockedChat && (
          <>
            <ResizeHandle onResize={onChatResize} />
            <DockedChat width={chatWidth} />
          </>
        )}
      </div>

      <FloatingChat />
    </div>
  )
}

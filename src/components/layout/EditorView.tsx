import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { SandpackProvider } from '@codesandbox/sandpack-react'
import { Loader2, MessageCircle } from 'lucide-react'
import { useAtomValue, useSetAtom } from 'jotai'
import { useFiles } from '@/hooks/useFiles'
import { useChat } from '@/hooks/useChat'
import { usePanelSizes } from '@/hooks/usePanelSizes'
import { useProjectLoader } from '@/hooks/useProjectLoader'
import { useDraft } from '@/hooks/useDraft'
import { useMessageSender } from '@/hooks/useMessageSender'
import { pendingImportAtom } from '@/atoms'
import { extractDependencies } from '@/services/fileParser'
import { TAILWIND_HTML, buildPackageJson } from '@/utils/defaultFiles'
import EditorHeader from '@/components/layout/EditorHeader'
import SandpackContent from '@/components/layout/SandpackContent'
import ResizeHandle from '@/components/layout/ResizeHandle'
import FloatingChat, { DockedChat } from '@/components/chat/FloatingChat'

const CHAT_MIN = 280
const CHAT_MAX = 600

export default function EditorView() {
  const { projectId } = useParams<{ projectId: string }>()
  const projectReady = useProjectLoader(projectId)
  const { files, setFiles, deps, setDeps } = useFiles()
  const { mode: chatMode, isOpen: isChatOpen, setIsOpen: setIsChatOpen } = useChat()
  useDraft()
  const { chatWidth, setChatWidth } = usePanelSizes()

  const pendingImport = useAtomValue(pendingImportAtom)
  const setPendingImport = useSetAtom(pendingImportAtom)
  const { sendMessage } = useMessageSender()

  // When files change: extract new deps from imports (skip package.json to avoid circular update)
  useEffect(() => {
    const filesToScan = Object.fromEntries(
      Object.entries(files).filter(([p]) => p !== '/package.json'),
    )
    const newDeps = extractDependencies(filesToScan)
    setDeps((prev) => {
      const hasNew = Object.keys(newDeps).some((k) => !(k in prev))
      return hasNew ? { ...prev, ...newDeps } : prev
    })
  }, [files, setDeps])

  // When deps change: keep package.json in sync so it's visible in the editor
  useEffect(() => {
    const next = buildPackageJson(deps)
    setFiles((prev) => prev['/package.json'] === next ? prev : { ...prev, '/package.json': next })
  }, [deps, setFiles])

  useEffect(() => {
    if (!projectReady || !pendingImport || pendingImport.projectId !== projectId) return
    setPendingImport(null)
    void sendMessage(pendingImport.prompt)
  }, [projectReady, pendingImport, projectId, setPendingImport, sendMessage])

  const isDocked = chatMode === 'docked'
  const showDockedChat = isDocked && isChatOpen

  // Live width during drag — mutate DOM directly, no setState per frame
  const chatWidthRef = useRef(chatWidth)
  chatWidthRef.current = chatWidth
  const chatPanelRef = useRef<HTMLDivElement>(null)

  const onChatResize = useCallback((delta: number) => {
    const next = Math.min(CHAT_MAX, Math.max(CHAT_MIN, chatWidthRef.current - delta))
    chatWidthRef.current = next
    if (chatPanelRef.current) chatPanelRef.current.style.width = `${next}px`
  }, [])

  const onChatCommit = useCallback(() => {
    setChatWidth(chatWidthRef.current)
  }, [setChatWidth])

  const sandpackKey = useMemo(() => {
    const filesHash = Object.entries(files)
      .map(([p, c]) => `${p}:${c.length}`)
      .sort()
      .join('|')
    const depsKey = Object.keys(deps).sort().join(',')
    return `${projectId}-${filesHash}-${depsKey}`
  }, [projectId, files, deps])

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
            <ResizeHandle onResize={onChatResize} onCommit={onChatCommit} />
            <DockedChat ref={chatPanelRef} width={chatWidth} />
          </>
        )}
      </div>

      <FloatingChat />
    </div>
  )
}

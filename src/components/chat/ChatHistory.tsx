import { useEffect, useRef } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { useAtomValue } from 'jotai'
import { projectImagesAtom } from '@/atoms'
import { useMessagesValue } from '@/hooks/useMessages'
import { useFiles } from '@/hooks/useFiles'
import { parseFilesFromResponse, mergeFiles, extractDependencies } from '@/services/fileParser'
import { generateImagesFiles } from '@/hooks/useProjectImages'
import { DEFAULT_FILES } from '@/utils/defaultFiles'
import Tooltip from '@/components/ui/Tooltip'
import ChatMessage from './ChatMessage'
import { CodeViewerProvider } from './CodeViewerContext'

const FILE_BLOCK_RE = /```[\w]*\s+file="[^"]+"/

export default function ChatHistory() {
  const { messages, isGenerating } = useMessagesValue()
  const { setFiles, setDeps } = useFiles()
  const images = useAtomValue(projectImagesAtom)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isGenerating])

  const hasAnyCode = messages.some((m) => m.role === 'assistant' && FILE_BLOCK_RE.test(m.content))

  function reapplyAll() {
    const imageFiles = images.length > 0 ? generateImagesFiles(images) : {}
    let accumulated = { ...DEFAULT_FILES, ...imageFiles }
    for (const msg of messages) {
      if (msg.role !== 'assistant') continue
      const parsed = parseFilesFromResponse(msg.content)
      if (Object.keys(parsed).length > 0) {
        accumulated = mergeFiles(accumulated, parsed)
      }
    }
    setFiles(accumulated)
    const newDeps = extractDependencies(accumulated)
    if (Object.keys(newDeps).length > 0) setDeps((prev) => ({ ...prev, ...newDeps }))
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted text-sm text-center px-4">
        Descreva o que deseja construir...
      </div>
    )
  }

  return (
    <CodeViewerProvider>
    <div className="flex-1 overflow-y-auto flex flex-col pr-1">
      <div className="flex-1 space-y-3">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isGenerating && (
          <div className="flex items-center gap-2 text-text-secondary text-xs py-1">
            <Loader2 size={14} className="animate-spin" />
            Gerando código...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {hasAnyCode && !isGenerating && (
        <div className="pt-2 pb-1 flex justify-center">
          <Tooltip content="Reprocessa todas as mensagens e aplica o código final no editor" side="top">
            <button
              onClick={reapplyAll}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-vibe-blue border border-border-subtle hover:border-vibe-blue/30 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={11} />
              Aplicar código no editor
            </button>
          </Tooltip>
        </div>
      )}
    </div>
    </CodeViewerProvider>
  )
}

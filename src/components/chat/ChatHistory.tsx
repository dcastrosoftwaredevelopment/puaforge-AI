import { useEffect, useRef } from 'react'
import { useAtomValue } from 'jotai'
import { messagesAtom, isGeneratingAtom } from '@/atoms'
import ChatMessage from './ChatMessage'
import { Loader2 } from 'lucide-react'

export default function ChatHistory() {
  const messages = useAtomValue(messagesAtom)
  const isGenerating = useAtomValue(isGeneratingAtom)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isGenerating])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted text-sm text-center px-4">
        Descreva o que deseja construir...
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
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
  )
}

import { useState, type KeyboardEvent } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { useAtom, useAtomValue } from 'jotai'
import { Send } from 'lucide-react'
import { messagesAtom, isGeneratingAtom, selectedModelAtom } from '@/atoms'
import { useFiles } from '@/hooks/useFiles'
import { generateCode } from '@/services/aiService'
import { mergeFiles } from '@/services/fileParser'

export default function PromptInput() {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useAtom(messagesAtom)
  const { files, setFiles } = useFiles()
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom)
  const selectedModel = useAtomValue(selectedModelAtom)

  const handleSend = async () => {
    const text = prompt.trim()
    if (!text || isGenerating) return

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: text,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setPrompt('')
    setIsGenerating(true)

    try {
      const result = await generateCode({
        prompt: text,
        model: selectedModel,
        currentFiles: files,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      })

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.rawResponse,
          timestamp: Date.now(),
        },
      ])

      if (Object.keys(result.files).length > 0) {
        setFiles((prev) => mergeFiles(prev, result.files))
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Erro ao gerar código. Tente novamente.',
          timestamp: Date.now(),
        },
      ])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="relative">
      <TextareaAutosize
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        minRows={4}
        maxRows={8}
        className="w-full bg-bg-tertiary border border-border-subtle rounded-xl p-3 pr-11 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-border-default transition"
        placeholder="Descreva o que deseja construir..."
        disabled={isGenerating}
      />
      <button
        onClick={handleSend}
        disabled={isGenerating || !prompt.trim()}
        className="absolute right-2.5 bottom-2.5 p-1.5 rounded-lg bg-bg-elevated text-text-secondary border border-border-subtle hover:text-text-primary hover:bg-border-default disabled:opacity-20 transition"
      >
        <Send size={14} />
      </button>
    </div>
  )
}

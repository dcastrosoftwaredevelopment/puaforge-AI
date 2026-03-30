import { useRef, useState } from 'react'
import { GripHorizontal, Trash2, PanelRightClose, PanelRightOpen, Minus, Download, Upload } from 'lucide-react'
import { useFiles } from '@/hooks/useFiles'
import { useChat } from '@/hooks/useChat'
import { useMessages } from '@/hooks/useMessages'
import { DEFAULT_FILES } from '@/utils/defaultFiles'
import type { Message } from '@/atoms'

import { useFloatingPanel, type ResizeDirection } from '@/hooks/useFloatingPanel'
import ChatHistory from './ChatHistory'
import PromptInput from './PromptInput'
import ChatToggleButton from './ChatToggleButton'
import ModelSelector from './ModelSelector'
import ConfirmModal from '@/components/ui/ConfirmModal'

const INITIAL_WIDTH = 430
const INITIAL_HEIGHT = 540

const resizeHandles: { direction: ResizeDirection; className: string }[] = [
  { direction: 'n', className: 'top-0 left-3 right-3 h-2 cursor-ns-resize' },
  { direction: 's', className: 'bottom-0 left-3 right-3 h-2 cursor-ns-resize' },
  { direction: 'w', className: 'left-0 top-3 bottom-3 w-2 cursor-ew-resize' },
  { direction: 'e', className: 'right-0 top-3 bottom-3 w-2 cursor-ew-resize' },
  { direction: 'nw', className: 'top-0 left-0 w-4 h-4 cursor-nwse-resize' },
  { direction: 'ne', className: 'top-0 right-0 w-4 h-4 cursor-nesw-resize' },
  { direction: 'sw', className: 'bottom-0 left-0 w-4 h-4 cursor-nesw-resize' },
  { direction: 'se', className: 'bottom-0 right-0 w-4 h-4 cursor-nwse-resize' },
]

function ChatPanel({ isDocked, onDragStart }: { isDocked: boolean; onDragStart?: (e: React.PointerEvent) => void }) {
  const { messages, setMessages } = useMessages()
  const { setFiles, setDeps } = useFiles()
  const { mode: chatMode, setMode: setChatMode, setIsOpen } = useChat()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  function exportMessages() {
    const data = JSON.stringify(messages, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importMessages(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Message[]
        if (Array.isArray(parsed)) setMessages((prev) => [...prev, ...parsed])
      } catch {
        // invalid file — ignore
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <>
      {/* Header */}
      <div
        onPointerDown={onDragStart}
        className={`px-4 py-3 border-b border-border-subtle flex items-center justify-between select-none ${!isDocked ? 'cursor-grab active:cursor-grabbing' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-vibe-blue animate-pulse shadow-[0_0_6px_rgba(0,229,255,0.6)]" />
          <span className="flex items-center gap-1 text-xs">
            <span className="font-sans font-bold text-vibe-blue">PuaForge</span>
            <span className="text-[8px] font-bold text-forge-terracotta leading-none">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={importMessages} />
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => importRef.current?.click()}
            className="group relative p-1 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
          >
            <Upload size={12} />
            <span className="pointer-events-none absolute top-full right-0 mt-1.5 px-2 py-1 rounded-md bg-bg-elevated border border-border-subtle text-[10px] text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-lg z-50">
              Importar mensagens
            </span>
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={exportMessages}
            disabled={messages.length === 0}
            className="group relative p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-30 transition cursor-pointer"
          >
            <Download size={12} />
            <span className="pointer-events-none absolute top-full right-0 mt-1.5 px-2 py-1 rounded-md bg-bg-elevated border border-border-subtle text-[10px] text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-lg z-50">
              Exportar mensagens
            </span>
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setShowClearConfirm(true)}
            className="group relative p-1 rounded text-forge-terracotta/60 hover:text-forge-terracotta transition cursor-pointer"
          >
            <Trash2 size={12} />
            <span className="pointer-events-none absolute top-full right-0 mt-1.5 px-2 py-1 rounded-md bg-bg-elevated border border-border-subtle text-[10px] text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-lg z-50">
              Limpar conversa
            </span>
          </button>
          {isDocked && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setIsOpen(false)}
              className="group relative p-1 rounded text-forge-terracotta/60 hover:text-forge-terracotta transition cursor-pointer"
            >
              <Minus size={13} />
              <span className="pointer-events-none absolute top-full right-0 mt-1.5 px-2 py-1 rounded-md bg-bg-elevated border border-border-subtle text-[10px] text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-lg z-50">
                Minimizar chat
              </span>
            </button>
          )}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setChatMode(chatMode === 'docked' ? 'floating' : 'docked')}
            className="group relative p-1 rounded text-forge-terracotta/60 hover:text-forge-terracotta transition cursor-pointer"
          >
            {chatMode === 'docked' ? <PanelRightOpen size={13} /> : <PanelRightClose size={13} />}
            <span className="pointer-events-none absolute top-full right-0 mt-1.5 px-2 py-1 rounded-md bg-bg-elevated border border-border-subtle text-[10px] text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-lg z-50">
              {chatMode === 'docked' ? 'Modo flutuante' : 'Fixar no painel'}
            </span>
          </button>
          {!isDocked && <GripHorizontal size={14} className="text-text-muted" />}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden p-4 flex flex-col">
        <ChatHistory />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-border-subtle space-y-2">
        <PromptInput />
        <div className="flex items-center justify-between">
          <ModelSelector />
          <span className="text-[10px] text-text-muted">Shift+Enter para nova linha</span>
        </div>
      </div>

      <ConfirmModal
        open={showClearConfirm}
        title="Limpar conversa"
        message="Isso vai apagar todo o histórico de mensagens e resetar o código para o estado inicial. Esta ação não pode ser desfeita."
        confirmLabel="Limpar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          setMessages([])
          setFiles(DEFAULT_FILES)
          setDeps({})
          setShowClearConfirm(false)
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </>
  )
}

function FloatingMode() {
  const { isOpen: isChatOpen } = useChat()
  const { position, size, onDragStart, onResizeStart } = useFloatingPanel({
    initialPosition: {
      x: window.innerWidth - INITIAL_WIDTH - 30,
      y: window.innerHeight - INITIAL_HEIGHT - 70,
    },
    initialSize: { width: INITIAL_WIDTH, height: INITIAL_HEIGHT },
  })

  return (
    <>
      <ChatToggleButton />

      {isChatOpen && (
        <div
          className="fixed bg-bg-secondary/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/40 border border-border-default flex flex-col z-50 overflow-hidden"
          style={{
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
          }}
        >
          {resizeHandles.map(({ direction, className }) => (
            <div
              key={direction}
              className={`absolute z-10 ${className}`}
              onPointerDown={(e) => onResizeStart(direction, e)}
            />
          ))}

          <ChatPanel isDocked={false} onDragStart={onDragStart} />
        </div>
      )}
    </>
  )
}

export function DockedChat({ width }: { width: number }) {
  return (
    <div className="shrink-0 border-l border-border-subtle bg-bg-secondary flex flex-col h-full" style={{ width }}>
      <ChatPanel isDocked={true} />
    </div>
  )
}

export default function FloatingChat() {
  const { mode: chatMode } = useChat()

  if (chatMode === 'docked') return null
  return <FloatingMode />
}

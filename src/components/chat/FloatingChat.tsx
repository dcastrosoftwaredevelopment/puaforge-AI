import { useState } from 'react'
import { GripHorizontal, Trash2, PanelRightClose, PanelRightOpen, Minus } from 'lucide-react'
import { useFiles } from '@/hooks/useFiles'
import { useChat } from '@/hooks/useChat'
import { useMessages } from '@/hooks/useMessages'
import { DEFAULT_FILES } from '@/utils/defaultFiles'

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
  const { setMessages } = useMessages()
  const { setFiles, setDeps } = useFiles()
  const { mode: chatMode, setMode: setChatMode, setIsOpen } = useChat()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  return (
    <>
      {/* Header */}
      <div
        onPointerDown={onDragStart}
        className={`px-4 py-3 border-b border-border-subtle flex items-center justify-between select-none ${!isDocked ? 'cursor-grab active:cursor-grabbing' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-text-secondary">Vibe AI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setShowClearConfirm(true)}
            className="group relative p-1 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
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
              className="group relative p-1 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
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
            className="group relative p-1 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
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

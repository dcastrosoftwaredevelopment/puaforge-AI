import { useAtomValue, useSetAtom } from 'jotai'
import { GripHorizontal, Trash2 } from 'lucide-react'
import { isChatOpenAtom, messagesAtom } from '@/atoms'
import { useFiles } from '@/hooks/useFiles'
import { DEFAULT_FILES } from '@/utils/defaultFiles'
import { db } from '@/services/db'
import { useFloatingPanel, type ResizeDirection } from '@/hooks/useFloatingPanel'
import ChatHistory from './ChatHistory'
import PromptInput from './PromptInput'
import ChatToggleButton from './ChatToggleButton'
import ModelSelector from './ModelSelector'

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

export default function FloatingChat() {
  const isChatOpen = useAtomValue(isChatOpenAtom)
  const setMessages = useSetAtom(messagesAtom)
  const { setFiles } = useFiles()
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
          {/* Resize handles */}
          {resizeHandles.map(({ direction, className }) => (
            <div
              key={direction}
              className={`absolute z-10 ${className}`}
              onPointerDown={(e) => onResizeStart(direction, e)}
            />
          ))}

          {/* Draggable header */}
          <div
            onPointerDown={onDragStart}
            className="px-4 py-3 border-b border-border-subtle flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-text-secondary">Vibe AI</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={async () => {
                  await Promise.all([
                    db.messages.clear(),
                    db.projectFiles.clear(),
                  ])
                  setMessages([])
                  setFiles(DEFAULT_FILES)
                }}
                className="p-1 rounded text-text-muted hover:text-text-primary transition"
                title="Limpar conversa"
              >
                <Trash2 size={12} />
              </button>
              <GripHorizontal size={14} className="text-text-muted" />
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
        </div>
      )}
    </>
  )
}

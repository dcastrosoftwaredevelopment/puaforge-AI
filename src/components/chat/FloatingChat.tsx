import { useRef, useState, forwardRef } from 'react'
import { GripHorizontal, Trash2, PanelRightClose, PanelRightOpen, Minus, Download, Upload } from 'lucide-react'
import { useAtomValue } from 'jotai'
import { useTranslation } from 'react-i18next'
import { projectsAtom, activeProjectIdAtom } from '@/atoms'
import { useFiles } from '@/hooks/useFiles'
import { useChat } from '@/hooks/useChat'
import { useMessages } from '@/hooks/useMessages'
import { DEFAULT_FILES } from '@/utils/defaultFiles'
import type { Message } from '@/atoms'

import { useFloatingPanel, type ResizeDirection } from '@/hooks/useFloatingPanel'
import { useIsMobile } from '@/hooks/useIsMobile'
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
  const projects = useAtomValue(projectsAtom)
  const activeProjectId = useAtomValue(activeProjectIdAtom)
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  function exportMessages() {
    const projectName = projects.find((p) => p.id === activeProjectId)?.name ?? 'projeto'
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '-')
    const data = JSON.stringify(messages, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${slug}-${date}-${time}.json`
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
              {t('chat.importMessages')}
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
              {t('chat.exportMessages')}
            </span>
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setShowClearConfirm(true)}
            className="group relative p-1 rounded text-forge-terracotta/60 hover:text-forge-terracotta transition cursor-pointer"
          >
            <Trash2 size={12} />
            <span className="pointer-events-none absolute top-full right-0 mt-1.5 px-2 py-1 rounded-md bg-bg-elevated border border-border-subtle text-[10px] text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-lg z-50">
              {t('chat.clearChat')}
            </span>
          </button>
          {isDocked && !isMobile && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setIsOpen(false)}
              className="group relative p-1 rounded text-forge-terracotta/60 hover:text-forge-terracotta transition cursor-pointer"
            >
              <Minus size={13} />
              <span className="pointer-events-none absolute top-full right-0 mt-1.5 px-2 py-1 rounded-md bg-bg-elevated border border-border-subtle text-[10px] text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-lg z-50">
                {t('chat.minimize')}
              </span>
            </button>
          )}
          {!isMobile && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setChatMode(chatMode === 'docked' ? 'floating' : 'docked')}
              className="group relative p-1 rounded text-forge-terracotta/60 hover:text-forge-terracotta transition cursor-pointer"
            >
              {chatMode === 'docked' ? <PanelRightOpen size={13} /> : <PanelRightClose size={13} />}
              <span className="pointer-events-none absolute top-full right-0 mt-1.5 px-2 py-1 rounded-md bg-bg-elevated border border-border-subtle text-[10px] text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-lg z-50">
                {chatMode === 'docked' ? t('chat.toFloating') : t('chat.toDocked')}
              </span>
            </button>
          )}
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
          <span className="text-[10px] text-text-muted">{t('chat.shiftEnter')}</span>
        </div>
      </div>

      <ConfirmModal
        open={showClearConfirm}
        title={t('chat.clearTitle')}
        message={t('chat.clearMessage')}
        confirmLabel={t('chat.clear')}
        cancelLabel={t('chat.cancel')}
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
  const { position, size, panelRef, onDragStart, onResizeStart } = useFloatingPanel({
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
          ref={panelRef}
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

/** Inline chat panel for mobile — no fixed positioning, fits inside the flex layout */
export function MobileChatPanel() {
  return (
    <div className="flex-1 flex flex-col bg-bg-secondary overflow-hidden">
      <ChatPanel isDocked={true} />
    </div>
  )
}

export const DockedChat = forwardRef<HTMLDivElement, { width: number }>(function DockedChat({ width }, ref) {
  return (
    <div ref={ref} className="shrink-0 border-l border-border-subtle bg-bg-secondary flex flex-col h-full" style={{ width }}>
      <ChatPanel isDocked={true} />
    </div>
  )
})

export default function FloatingChat() {
  const { mode: chatMode } = useChat()
  const isMobile = useIsMobile()

  // On mobile the chat is rendered inline in EditorView — nothing to do here
  if (isMobile || chatMode === 'docked') return null
  return <FloatingMode />
}

import { useChat } from '@/hooks/useChat'
import { useFloatingPanel, type ResizeDirection } from '@/hooks/useFloatingPanel'
import ChatToggleButton from './ChatToggleButton'
import ChatPanel from './ChatPanel'

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

export default function FloatingMode() {
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

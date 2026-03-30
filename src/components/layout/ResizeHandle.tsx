import { useCallback, useRef, useState } from 'react'

interface ResizeHandleProps {
  onResize: (delta: number) => void
}

export default function ResizeHandle({ onResize }: ResizeHandleProps) {
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const rafId = useRef<number | null>(null)
  const pendingDelta = useRef(0)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    startX.current = e.clientX
    setDragging(true)

    const target = e.currentTarget

    const onMove = (ev: PointerEvent) => {
      pendingDelta.current += ev.clientX - startX.current
      startX.current = ev.clientX

      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(() => {
          onResize(pendingDelta.current)
          pendingDelta.current = 0
          rafId.current = null
        })
      }
    }

    const onUp = () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
        rafId.current = null
      }
      pendingDelta.current = 0
      setDragging(false)
      target.removeEventListener('pointermove', onMove as EventListener)
      target.removeEventListener('pointerup', onUp)
    }

    target.addEventListener('pointermove', onMove as EventListener)
    target.addEventListener('pointerup', onUp)
  }, [onResize])

  return (
    <div
      onPointerDown={onPointerDown}
      className={`w-1 shrink-0 cursor-col-resize transition-colors select-none ${
        dragging ? 'bg-accent' : 'bg-border-subtle hover:bg-accent/60'
      }`}
    />
  )
}

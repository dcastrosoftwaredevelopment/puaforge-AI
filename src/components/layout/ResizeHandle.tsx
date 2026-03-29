import { useCallback, useRef, useState } from 'react'

interface ResizeHandleProps {
  onResize: (delta: number) => void
}

export default function ResizeHandle({ onResize }: ResizeHandleProps) {
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    startX.current = e.clientX
    setDragging(true)

    const target = e.currentTarget

    const onMove = (ev: PointerEvent) => {
      const delta = ev.clientX - startX.current
      startX.current = ev.clientX
      onResize(delta)
    }

    const onUp = () => {
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
        dragging ? 'bg-accent' : 'bg-transparent hover:bg-border-default'
      }`}
    />
  )
}

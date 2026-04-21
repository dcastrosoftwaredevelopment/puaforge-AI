import { forwardRef } from 'react'
import ChatPanel from './ChatPanel'

export const DockedChat = forwardRef<HTMLDivElement, { width: number }>(function DockedChat({ width }, ref) {
  return (
    <div ref={ref} className="shrink-0 border-l border-border-subtle bg-bg-secondary flex flex-col h-full" style={{ width }}>
      <ChatPanel isDocked={true} />
    </div>
  )
})

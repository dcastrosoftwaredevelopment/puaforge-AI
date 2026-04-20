import { type ReactNode } from 'react'
import { Tooltip as FlowbiteTooltip } from 'flowbite-react'
import type { Placement } from '@floating-ui/core'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
  align?: 'left' | 'center' | 'right'
  width?: string
}

function toPlacement(side: 'top' | 'bottom', align: 'left' | 'center' | 'right'): Placement {
  if (align === 'left') return `${side}-start`
  if (align === 'right') return `${side}-end`
  return side
}

export default function Tooltip({ content, children, side = 'bottom', align = 'center' }: TooltipProps) {
  return (
    <FlowbiteTooltip content={content} placement={toPlacement(side, align)} style="auto" arrow={false}>
      <span className="contents">{children}</span>
    </FlowbiteTooltip>
  )
}

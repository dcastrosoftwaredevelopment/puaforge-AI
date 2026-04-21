import { type ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom';
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export default function Tooltip({
  content,
  children,
  side = 'bottom',
  align = 'center',
  width = 'w-max',
}: TooltipProps) {
  const vertical = side === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5';
  const horizontal = align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2';

  return (
    <div className="relative group">
      {children}
      <div
        className={`pointer-events-none absolute ${vertical} ${horizontal} ${width} px-2.5 py-1.5 rounded-md bg-bg-elevated border border-border-subtle text-[10px] text-text-secondary leading-relaxed opacity-0 group-hover:opacity-100 transition shadow-lg z-50`}
      >
        {content}
      </div>
    </div>
  );
}

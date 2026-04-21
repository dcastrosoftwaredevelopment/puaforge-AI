import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const TEXT_COLLAPSE_CHARS = 400;

export default function CollapsibleText({
  children,
  content,
  fadeColor = 'var(--color-bg-secondary)',
}: {
  children: React.ReactNode;
  content: string;
  fadeColor?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  const isLong = content.length > TEXT_COLLAPSE_CHARS;

  if (!isLong) return <>{children}</>;

  return (
    <div>
      <div className="relative overflow-hidden" style={expanded ? undefined : { maxHeight: '110px' }}>
        {children}
        {!expanded && (
          <div
            className="absolute bottom-0 left-0 right-0 h-10"
            style={{ background: `linear-gradient(to top, ${fadeColor}, transparent)` }}
          />
        )}
      </div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 text-[11px] text-text-muted hover:text-vibe-blue transition-colors cursor-pointer"
      >
        {expanded ? t('chat.showLess') : t('chat.showMore')}
      </button>
    </div>
  );
}

import { memo } from 'react';
import { FileCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCodeViewer } from '@/hooks/useCodeViewer';
import type { CodeSegment } from '@/utils/messageParser';

const PREVIEW_LINES = 6;

const CodeBlock = memo(function CodeBlock({ language, filePath, code }: CodeSegment) {
  const { open } = useCodeViewer();
  const { t } = useTranslation();
  const lines = code.split('\n');
  const previewCode = lines.slice(0, PREVIEW_LINES).join('\n');
  const hasMore = lines.length > PREVIEW_LINES;

  return (
    <div
      className="my-2 rounded-lg overflow-hidden border border-border-subtle cursor-pointer group"
      onClick={() => open({ language, filePath, code })}
    >
      <div className="flex items-center justify-between px-3 py-1.5 bg-bg-secondary border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <FileCode size={11} className="text-text-muted shrink-0" />
          <span className="text-[11px] font-mono text-text-secondary truncate">
            {filePath ?? language}
          </span>
        </div>
        {hasMore && (
          <span className="text-[10px] text-text-muted shrink-0 ml-2 group-hover:text-vibe-blue transition-colors">
            {t('chat.codeLines', { count: lines.length - PREVIEW_LINES })}
          </span>
        )}
        {!hasMore && (
          <span className="text-[10px] text-text-muted shrink-0 ml-2 group-hover:text-vibe-blue transition-colors opacity-0 group-hover:opacity-100">
            {t('chat.codeClick')}
          </span>
        )}
      </div>

      <div className="relative">
        <pre
          className="m-0 px-3 py-2.5 bg-bg-primary text-[11px] font-mono text-code-muted leading-relaxed overflow-hidden whitespace-pre"
          style={{ maxHeight: `${PREVIEW_LINES * 18}px` }}
        >
          {previewCode}
        </pre>
        {hasMore && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-bg-primary to-transparent" />
        )}
      </div>
    </div>
  );
});

export default CodeBlock;

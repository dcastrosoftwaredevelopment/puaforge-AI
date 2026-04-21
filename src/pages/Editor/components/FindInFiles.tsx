import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSandpack } from '@codesandbox/sandpack-react';
import { useFiles } from '@/hooks/useFiles';

interface Match {
  file: string;
  line: number;
  preview: string;
  matchStart: number;
  matchEnd: number;
}

function search(files: Record<string, string>, query: string): Match[] {
  if (!query.trim()) return [];
  const results: Match[] = [];
  const lower = query.toLowerCase();

  for (const [path, code] of Object.entries(files)) {
    if (path === '/index.html') continue;
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const idx = line.toLowerCase().indexOf(lower);
      if (idx !== -1) {
        results.push({
          file: path,
          line: i + 1,
          preview: line.trim(),
          matchStart: line.slice(0, idx).trimStart().length,
          matchEnd: line.slice(0, idx).trimStart().length + query.length,
        });
      }
    }
  }
  return results;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function FindInFiles({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const { files } = useFiles();
  const { sandpack } = useSandpack();
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [open]);

  const results = search(files, query);

  function goTo(file: string) {
    sandpack.openFile(file);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="absolute top-0 right-0 z-20 w-96 bg-bg-elevated border border-border-default rounded-bl-xl shadow-xl flex flex-col max-h-[60vh]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
        <Search size={13} className="text-text-muted shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('findInFiles.placeholder')}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
        />
        {query && (
          <span className="text-xs text-text-muted shrink-0">
            {t('findInFiles.results', { count: results.length })}
          </span>
        )}
        <button onClick={onClose} className="text-text-muted hover:text-text-primary transition cursor-pointer">
          <X size={13} />
        </button>
      </div>

      {results.length > 0 && (
        <div className="overflow-y-auto">
          {Object.entries(
            results.reduce<Record<string, Match[]>>((acc, m) => {
              acc[m.file] = [...(acc[m.file] ?? []), m];
              return acc;
            }, {}),
          ).map(([file, matches]) => (
            <div key={file}>
              <div className="px-3 py-1.5 text-xs font-medium text-text-muted bg-bg-primary sticky top-0">{file}</div>
              {matches.map((m, i) => (
                <button
                  key={i}
                  onClick={() => goTo(m.file)}
                  className="w-full text-left px-4 py-1.5 text-xs font-mono hover:bg-bg-primary flex gap-3 items-baseline cursor-pointer transition-colors"
                >
                  <span className="text-text-muted shrink-0 w-8 text-right">{m.line}</span>
                  <span className="text-text-secondary truncate">
                    {m.preview.slice(0, m.matchStart)}
                    <mark className="bg-vibe-blue/30 text-text-primary rounded-sm">
                      {m.preview.slice(m.matchStart, m.matchEnd)}
                    </mark>
                    {m.preview.slice(m.matchEnd)}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <p className="px-3 py-4 text-xs text-text-muted text-center">{t('findInFiles.noResults', { query })}</p>
      )}
    </div>
  );
}

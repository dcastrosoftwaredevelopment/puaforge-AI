import { createContext, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CodeEntry { language: string; filePath?: string; code: string }

interface CodeViewerContextValue {
  open: (entry: CodeEntry) => void
}

const CodeViewerContext = createContext<CodeViewerContextValue>({ open: () => {} })

export function useCodeViewer() {
  return useContext(CodeViewerContext)
}

export function CodeViewerProvider({ children }: { children: React.ReactNode }) {
  const [entry, setEntry] = useState<CodeEntry | null>(null)
  const { t } = useTranslation()

  return (
    <CodeViewerContext.Provider value={{ open: setEntry }}>
      <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">
        {children}

        {entry && (
          <div className="absolute inset-0 z-20 flex flex-col bg-bg-secondary">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-bg-secondary border-b border-border-subtle shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ef4444]/50" />
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]/50" />
                  <span className="w-2 h-2 rounded-full bg-[#10b981]/50" />
                </div>
                <span className="text-[11px] font-mono text-text-secondary ml-1 truncate">
                  {entry.filePath ?? entry.language}
                </span>
              </div>
              <button
                onClick={() => setEntry(null)}
                className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer text-xs"
                title={t('common.close')}
              >
                ✕
              </button>
            </div>

            {/* Scrollable code */}
            <div className="flex-1 overflow-auto">
              <CodeContent entry={entry} />
            </div>
          </div>
        )}
      </div>
    </CodeViewerContext.Provider>
  )
}

// Lazy-loaded highlighter — only paid when viewer opens
import { lazy, Suspense } from 'react'

const SyntaxHighlighter = lazy(() =>
  import('react-syntax-highlighter').then((m) => ({ default: m.Prism }))
)

const editorTheme: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': { color: '#e2e8f0', background: 'none', fontSize: '11.5px', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
  'pre[class*="language-"]': { background: '#0D0D0D', margin: 0, padding: 0 },
  comment: { color: '#4b5563', fontStyle: 'italic' },
  punctuation: { color: '#94a3b8' },
  property: { color: '#00E5FF' },
  tag: { color: '#D65A31' },
  'attr-name': { color: '#f59e0b' },
  'attr-value': { color: '#a5f3fc' },
  string: { color: '#a5f3fc' },
  boolean: { color: '#D65A31' },
  number: { color: '#f59e0b' },
  keyword: { color: '#c084fc' },
  function: { color: '#00E5FF' },
  'class-name': { color: '#f59e0b' },
  operator: { color: '#94a3b8' },
  variable: { color: '#e2e8f0' },
  constant: { color: '#f59e0b' },
  'template-string': { color: '#a5f3fc' },
  imports: { color: '#c084fc' },
  'maybe-class-name': { color: '#f59e0b' },
}

function CodeContent({ entry }: { entry: { language: string; code: string } }) {
  return (
    <Suspense fallback={
      <pre className="m-0 p-4 bg-bg-primary text-[11.5px] font-mono text-code-muted leading-relaxed whitespace-pre h-full">{entry.code}</pre>
    }>
      <SyntaxHighlighter
        language={entry.language || 'tsx'}
        style={editorTheme}
        customStyle={{ margin: 0, padding: '16px', background: 'var(--color-bg-primary)', fontSize: '11.5px', minHeight: '100%' }}
        showLineNumbers
        lineNumberStyle={{ color: '#374151', minWidth: '2.5em', paddingRight: '1em', userSelect: 'none' }}
        wrapLongLines={false}
      >
        {entry.code}
      </SyntaxHighlighter>
    </Suspense>
  )
}

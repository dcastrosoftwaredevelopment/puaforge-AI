import { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Bot, FileCode } from 'lucide-react'
import type { Message } from '@/atoms'
import { useCodeViewer } from './CodeViewerContext'

// ─── Message parser ────────────────────────────────────────────────────────────

interface TextSegment { type: 'text'; content: string }
interface CodeSegment { type: 'code'; language: string; filePath?: string; code: string }
type Segment = TextSegment | CodeSegment

const CODE_BLOCK_RE = /```(\w+)?(?:\s+file="([^"]+)")?\n([\s\S]*?)```/g

function parseSegments(content: string): Segment[] {
  const segments: Segment[] = []
  let last = 0
  let match: RegExpExecArray | null

  CODE_BLOCK_RE.lastIndex = 0
  while ((match = CODE_BLOCK_RE.exec(content)) !== null) {
    if (match.index > last) {
      const text = content.slice(last, match.index).trim()
      if (text) segments.push({ type: 'text', content: text })
    }
    segments.push({
      type: 'code',
      language: match[1] || 'text',
      filePath: match[2],
      code: match[3].replace(/\n$/, ''),
    })
    last = match.index + match[0].length
  }

  const remaining = content.slice(last).trim()
  if (remaining) segments.push({ type: 'text', content: remaining })

  return segments
}

// ─── Code block component ─────────────────────────────────────────────────────

const PREVIEW_LINES = 6

const CodeBlock = memo(function CodeBlock({ language, filePath, code }: CodeSegment) {
  const { open } = useCodeViewer()
  const lines = code.split('\n')
  const previewCode = lines.slice(0, PREVIEW_LINES).join('\n')
  const hasMore = lines.length > PREVIEW_LINES

  return (
    <div
      className="my-2 rounded-lg overflow-hidden border border-[rgba(255,255,255,0.07)] cursor-pointer group"
      onClick={() => open({ language, filePath, code })}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#141414] border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2">
          <FileCode size={11} className="text-text-muted shrink-0" />
          <span className="text-[11px] font-mono text-text-secondary truncate">
            {filePath ?? language}
          </span>
        </div>
        {hasMore && (
          <span className="text-[10px] text-text-muted shrink-0 ml-2 group-hover:text-vibe-blue transition-colors">
            +{lines.length - PREVIEW_LINES} linhas — clique para expandir
          </span>
        )}
        {!hasMore && (
          <span className="text-[10px] text-text-muted shrink-0 ml-2 group-hover:text-vibe-blue transition-colors opacity-0 group-hover:opacity-100">
            clique para ver
          </span>
        )}
      </div>

      {/* Plain preview */}
      <div className="relative">
        <pre
          className="m-0 px-3 py-2.5 bg-[#0D0D0D] text-[11px] font-mono text-[#94a3b8] leading-relaxed overflow-hidden whitespace-pre"
          style={{ maxHeight: `${PREVIEW_LINES * 18}px` }}
        >
          {previewCode}
        </pre>
        {hasMore && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0D0D0D] to-transparent" />
        )}
      </div>
    </div>
  )
})

// ─── Chat message ──────────────────────────────────────────────────────────────

interface Props { message: Message }

function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'
  const segments = useMemo(
    () => isUser ? null : parseSegments(message.content),
    [isUser, message.content],
  )

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
          isUser ? 'bg-forge-terracotta/15 text-forge-terracotta' : 'bg-vibe-blue/10 text-vibe-blue'
        }`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div
        className={`max-w-[85%] min-w-0 rounded-xl px-3 py-2.5 text-sm leading-relaxed break-words overflow-hidden ${
          isUser ? 'bg-chat-user text-text-primary' : 'bg-chat-ai text-text-secondary'
        }`}
      >
        {isUser && message.images && message.images.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-2">
            {message.images.map((img, i) => (
              <img
                key={i}
                src={`data:${img.mediaType};base64,${img.base64}`}
                alt="Uploaded"
                className="max-w-[200px] max-h-[150px] object-contain rounded-lg"
              />
            ))}
          </div>
        )}

        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <>
            {segments!.map((seg, i) =>
              seg.type === 'text' ? (
                <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}
                  components={{
                    code: ({ children, className }) => {
                      const isBlock = !!className?.includes('language-')
                      return isBlock ? (
                        <pre className="bg-[#0D0D0D] rounded p-2 my-1 text-[11px] font-mono text-[#94a3b8] overflow-x-auto whitespace-pre">{children}</pre>
                      ) : (
                        <code className="bg-bg-primary px-1.5 py-0.5 rounded text-xs text-text-primary font-mono">{children}</code>
                      )
                    },
                    pre: ({ children }) => <>{children}</>,
                  }}
                >
                  {seg.content}
                </ReactMarkdown>
              ) : (
                <CodeBlock key={i} {...seg} />
              )
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default memo(ChatMessage)

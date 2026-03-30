import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Bot, ChevronDown, ChevronUp } from 'lucide-react'
import type { Message } from '@/atoms'

const COLLAPSED_HEIGHT = 160 // px

interface Props {
  message: Message
}

function CollapsibleCode({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="relative my-2">
      <pre
        className="bg-bg-primary rounded-lg p-3 overflow-x-auto text-xs transition-all duration-200"
        style={expanded ? undefined : { maxHeight: COLLAPSED_HEIGHT, overflow: 'hidden' }}
      >
        <code>{children}</code>
      </pre>

      {!expanded && (
        <div className="absolute bottom-0 left-0 right-0 h-10 rounded-b-lg bg-gradient-to-t from-bg-primary to-transparent pointer-events-none" />
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition cursor-pointer"
      >
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        {expanded ? 'Recolher código' : 'Ver código completo'}
      </button>
    </div>
  )
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

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
          isUser
            ? 'bg-chat-user text-text-primary'
            : 'bg-chat-ai text-text-secondary'
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
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ children, className }) => {
                const isBlock = className?.includes('language-')
                return isBlock ? (
                  <CollapsibleCode>{children}</CollapsibleCode>
                ) : (
                  <code className="bg-bg-primary px-1.5 py-0.5 rounded text-xs text-text-primary">
                    {children}
                  </code>
                )
              },
              pre: ({ children }) => <>{children}</>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}

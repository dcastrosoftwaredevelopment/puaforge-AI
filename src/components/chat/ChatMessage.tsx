import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Bot } from 'lucide-react'
import type { Message } from '@/atoms'

interface Props {
  message: Message
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
          isUser ? 'bg-accent-muted text-text-primary' : 'bg-chat-ai text-text-secondary'
        }`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div
        className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-chat-user text-text-primary'
            : 'bg-chat-ai text-text-secondary'
        }`}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ children, className }) => {
                const isBlock = className?.includes('language-')
                return isBlock ? (
                  <pre className="bg-bg-primary rounded-lg p-3 my-2 overflow-x-auto text-xs">
                    <code>{children}</code>
                  </pre>
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

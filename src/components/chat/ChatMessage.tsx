import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot } from 'lucide-react';
import type { Message } from '@/atoms';
import { parseSegments } from '@/utils/messageParser';
import CollapsibleText from './CollapsibleText';
import CodeBlock from './CodeBlock';

interface Props {
  message: Message;
}

function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';
  const segments = useMemo(() => (isUser ? null : parseSegments(message.content)), [isUser, message.content]);

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
          isUser ? 'bg-forge-terracotta/15 text-forge-terracotta' : 'bg-vibe-blue/10 text-vibe-blue'
        }`}
      >
        {isUser ?
          <User size={14} />
        : <Bot size={14} />}
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

        {isUser ?
          <CollapsibleText content={message.content} fadeColor="var(--color-bg-tertiary)">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </CollapsibleText>
        : <>
            {segments!.map((seg, i) =>
              seg.type === 'text' ?
                <CollapsibleText key={i} content={seg.content} fadeColor="var(--color-bg-secondary)">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: ({ children, className }) => {
                        const isBlock = !!className?.includes('language-');
                        return isBlock ?
                            <pre className="bg-bg-primary rounded p-2 my-1 text-[11px] font-mono text-code-muted overflow-x-auto whitespace-pre">
                              {children}
                            </pre>
                          : <code className="bg-bg-primary px-1.5 py-0.5 rounded text-xs text-text-primary font-mono">
                              {children}
                            </code>;
                      },
                      pre: ({ children }) => <>{children}</>,
                    }}
                  >
                    {seg.content}
                  </ReactMarkdown>
                </CollapsibleText>
              : <CodeBlock key={i} {...seg} />,
            )}
          </>
        }
      </div>
    </div>
  );
}

export default memo(ChatMessage);

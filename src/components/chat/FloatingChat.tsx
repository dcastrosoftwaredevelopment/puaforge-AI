import { useChat } from '@/hooks/useChat';
import { useIsMobile } from '@/hooks/useIsMobile';
import FloatingMode from './FloatingMode';

export { default as MobileChatPanel } from './MobileChatPanel';
export { DockedChat } from './DockedChat';

export default function FloatingChat() {
  const { mode: chatMode } = useChat();
  const isMobile = useIsMobile();

  // On mobile the chat is rendered inline in EditorView — nothing to do here
  if (isMobile || chatMode === 'docked') return null;
  return <FloatingMode />;
}

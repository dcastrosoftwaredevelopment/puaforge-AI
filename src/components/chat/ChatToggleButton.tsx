import { MessageCircle, X } from 'lucide-react';
import { useChat } from '@/hooks/useChat';

export default function ChatToggleButton() {
  const { isOpen: isChatOpen, setIsOpen: setIsChatOpen } = useChat();

  return (
    <button
      onClick={() => setIsChatOpen((prev) => !prev)}
      className="fixed bottom-5 right-5 z-[60] w-12 h-12 rounded-full bg-forge-terracotta/10 hover:bg-forge-terracotta/20 text-forge-terracotta border border-forge-terracotta/30 shadow-lg shadow-black/30 flex items-center justify-center transition-all hover:scale-105"
    >
      {isChatOpen ? <X size={20} /> : <MessageCircle size={20} />}
    </button>
  );
}

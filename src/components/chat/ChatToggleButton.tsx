import { useAtom } from 'jotai'
import { MessageCircle, X } from 'lucide-react'
import { isChatOpenAtom } from '@/atoms'

export default function ChatToggleButton() {
  const [isChatOpen, setIsChatOpen] = useAtom(isChatOpenAtom)

  return (
    <button
      onClick={() => setIsChatOpen((prev) => !prev)}
      className="fixed bottom-5 right-5 z-[60] w-12 h-12 rounded-full bg-bg-elevated hover:bg-border-default text-text-primary border border-border-default shadow-lg shadow-black/30 flex items-center justify-center transition-all hover:scale-105"
    >
      {isChatOpen ? <X size={20} /> : <MessageCircle size={20} />}
    </button>
  )
}

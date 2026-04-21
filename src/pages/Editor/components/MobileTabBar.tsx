import { Code2, Eye, MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useViewMode } from '@/hooks/useViewMode'
import { useChat } from '@/hooks/useChat'
import { useIsMobile } from '@/hooks/useIsMobile'

export default function MobileTabBar() {
  const { viewMode, setViewMode } = useViewMode()
  const { isOpen: isChatOpen, setIsOpen: setIsChatOpen } = useChat()
  const isMobile = useIsMobile()
  const { t } = useTranslation()

  const mobileTab = isChatOpen && isMobile ? 'chat' : viewMode === 'split' ? 'preview' : viewMode

  return (
    <div className="flex md:hidden shrink-0 border-t border-border-subtle bg-bg-secondary">
      {([
        { tab: 'editor', icon: <Code2 size={18} />, label: t('viewToggle.code') },
        { tab: 'preview', icon: <Eye size={18} />, label: t('viewToggle.preview') },
        { tab: 'chat', icon: <MessageSquare size={18} />, label: t('viewToggle.chat') },
      ] as const).map(({ tab, icon, label }) => (
        <button
          key={tab}
          onClick={() => {
            if (tab === 'chat') {
              setIsChatOpen(true)
              setViewMode('preview')
            } else {
              setIsChatOpen(false)
              setViewMode(tab)
            }
          }}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition ${
            mobileTab === tab ? 'text-vibe-blue' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  )
}

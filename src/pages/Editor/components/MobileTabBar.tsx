import { Code2, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMobileDrawer } from '@/hooks/useMobileDrawer';

export default function MobileTabBar() {
  const { t } = useTranslation();
  const { drawerOpen, drawerTab, openDrawer, closeDrawer, toggleDrawer } = useMobileDrawer();

  const isEditorActive = drawerOpen && drawerTab !== 'chat';
  const isChatActive = drawerOpen && drawerTab === 'chat';

  const handleEditorPress = () => {
    if (isEditorActive) {
      closeDrawer();
    } else {
      // Open on last editor tab (if drawerTab is 'chat', default to 'style')
      openDrawer(drawerTab === 'chat' ? 'style' : drawerTab);
    }
  };

  return (
    <div className="flex shrink-0 border-t border-border-subtle bg-bg-secondary md:hidden">
      <button
        onClick={handleEditorPress}
        className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition ${isEditorActive ? 'text-forge-terracotta' : 'text-text-muted hover:text-text-secondary'}`}
      >
        <Code2 size={18} />
        {t('viewToggle.code')}
      </button>
      <button
        onClick={() => toggleDrawer('chat')}
        className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition ${isChatActive ? 'text-forge-terracotta' : 'text-text-muted hover:text-text-secondary'}`}
      >
        <MessageSquare size={18} />
        {t('viewToggle.chat')}
      </button>
    </div>
  );
}

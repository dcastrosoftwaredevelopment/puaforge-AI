import { Code2, Paintbrush, Layers, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMobileDrawer } from '@/hooks/useMobileDrawer';
import { useEditorPanelTabs } from '@/hooks/useEditorPanelTabs';
import type { MobileDrawerTab } from '@/atoms';

export default function MobileTabBar() {
  const { t } = useTranslation();
  const { drawerOpen, drawerTab, toggleDrawer } = useMobileDrawer();
  const { inspectMode } = useEditorPanelTabs();

  const tabs: Array<{ tab: MobileDrawerTab; icon: React.ReactNode; label: string; enabled: boolean }> = [
    { tab: 'code', icon: <Code2 size={18} />, label: t('inspect.tabCode'), enabled: true },
    { tab: 'style', icon: <Paintbrush size={18} />, label: t('inspect.tabStyle'), enabled: true },
    { tab: 'layers', icon: <Layers size={18} />, label: t('inspect.tabLayers'), enabled: inspectMode },
    { tab: 'chat', icon: <MessageSquare size={18} />, label: t('viewToggle.chat'), enabled: true },
  ];

  return (
    <div className="flex shrink-0 border-t border-border-subtle bg-bg-secondary md:hidden">
      {tabs.map(({ tab, icon, label, enabled }) => (
        <button
          key={tab}
          onClick={() => enabled && toggleDrawer(tab)}
          disabled={!enabled}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition ${
            drawerOpen && drawerTab === tab ? 'text-forge-terracotta'
            : enabled ? 'text-text-muted hover:text-text-secondary'
            : 'text-text-muted/30 cursor-not-allowed'
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}

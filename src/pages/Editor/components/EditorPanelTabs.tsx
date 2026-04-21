import { Code2, Paintbrush, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEditorPanelTabs } from '@/hooks/useEditorPanelTabs';
import type { EditorPanelMode } from '@/atoms';
import Tooltip from '@/components/ui/Tooltip';

export default function EditorPanelTabs() {
  const { t } = useTranslation();
  const { editorPanelMode, setEditorPanelMode, inspectMode, selectedElement } = useEditorPanelTabs();

  const tabs: Array<{ mode: EditorPanelMode; label: string; icon: React.ReactNode; enabled: boolean; disabledTip: string }> = [
    { mode: 'code', label: t('inspect.tabCode'), icon: <Code2 size={13} />, enabled: true, disabledTip: '' },
    { mode: 'style', label: t('inspect.tabStyle'), icon: <Paintbrush size={13} />, enabled: true, disabledTip: '' },
    { mode: 'layers', label: t('inspect.tabLayers'), icon: <Layers size={13} />, enabled: inspectMode, disabledTip: t('inspect.tabLayersDisabled') },
  ];

  return (
    <div className="flex items-center border-b border-border-subtle shrink-0 bg-bg-secondary">
      {tabs.map(({ mode, label, icon, enabled, disabledTip }) => {
        const isActive = editorPanelMode === mode;
        const btn = (
          <button
            key={mode}
            onClick={() => enabled && setEditorPanelMode(mode)}
            disabled={!enabled}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs transition border-b-2 cursor-pointer ${
              isActive
                ? 'text-text-primary border-forge-terracotta'
                : enabled
                  ? 'text-text-muted border-transparent hover:text-text-secondary'
                  : 'text-text-muted/40 border-transparent cursor-not-allowed'
            }`}
          >
            {icon}
            {label}
          </button>
        );

        if (!enabled && disabledTip) {
          return (
            <Tooltip key={mode} content={disabledTip} side="bottom" align="left">
              <span className="contents">{btn}</span>
            </Tooltip>
          );
        }
        return btn;
      })}
    </div>
  );
}

import { Code, Eye, Columns } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type ViewMode } from '@/atoms';
import { useViewMode } from '@/hooks/useViewMode';

export default function ViewToggle() {
  const { viewMode, setViewMode } = useViewMode();
  const { t } = useTranslation();

  const modes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'preview', icon: <Eye size={14} />, label: t('viewToggle.preview') },
    { mode: 'split', icon: <Columns size={14} />, label: t('viewToggle.split') },
    { mode: 'editor', icon: <Code size={14} />, label: t('viewToggle.code') },
  ];

  return (
    <div className="flex items-center gap-0.5 bg-bg-tertiary rounded-lg p-0.5 border border-border-subtle">
      {modes.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            viewMode === mode
              ? 'bg-bg-elevated text-text-primary shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}

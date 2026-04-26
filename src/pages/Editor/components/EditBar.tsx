import { Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function EditBar({ onDiscard }: { onDiscard: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-forge-terracotta/10 border-b border-forge-terracotta/20 shrink-0">
      <span className="text-[11px] font-medium text-forge-terracotta">{t('editor.manualEdit')}</span>
      <button
        onClick={onDiscard}
        className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
      >
        <Undo2 size={13} />
        {t('common.discard')}
      </button>
    </div>
  );
}

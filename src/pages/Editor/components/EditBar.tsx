import { Save, Undo2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function EditBar({ onSave, onDiscard }: { onSave: () => void; onDiscard: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-forge-terracotta/10 border-b border-forge-terracotta/20 shrink-0">
      <span className="text-[11px] font-medium text-forge-terracotta">{t('editor.manualEdit')}</span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onDiscard}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
        >
          <Undo2 size={13} />
          {t('common.discard')}
        </button>
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-accent/15 text-accent hover:bg-accent/25 transition cursor-pointer"
        >
          <Save size={13} />
          {t('common.save')}
        </button>
      </div>
    </div>
  )
}

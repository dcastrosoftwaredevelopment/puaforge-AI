import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus } from 'lucide-react';
import { useAdvancedSection } from '@/hooks/useAdvancedSection';
import StyleEditorSection from './StyleEditorSection';

const AdvancedSection = memo(() => {
  const { t } = useTranslation();
  const { allClasses, unknownClasses, removeOneClass, addOneClass } = useAdvancedSection();
  const [newClass, setNewClass] = useState('');
  return (
    <StyleEditorSection title={t('inspect.sectionAdvanced')} defaultOpen={false}>
      <div className="flex flex-wrap gap-1 min-h-6">
        {allClasses.map((cls) => (
          <span
            key={cls}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono border ${(unknownClasses as string[]).includes(cls) ? 'border-border-default text-text-secondary bg-bg-elevated' : 'border-border-subtle text-text-muted bg-bg-secondary'}`}
          >
            {cls}
            <button
              onClick={() => removeOneClass(cls)}
              className="text-text-muted/50 hover:text-red-400 transition cursor-pointer"
            >
              <X size={9} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={newClass}
          onChange={(e) => setNewClass(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newClass.trim()) {
              addOneClass(newClass.trim());
              setNewClass('');
            }
          }}
          placeholder={t('inspect.addClassPlaceholder')}
          className="flex-1 text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary outline-none focus:border-forge-terracotta font-mono"
        />
        <button
          onClick={() => {
            if (newClass.trim()) {
              addOneClass(newClass.trim());
              setNewClass('');
            }
          }}
          className="px-2 py-1 rounded bg-bg-elevated border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default transition cursor-pointer"
        >
          <Plus size={11} />
        </button>
      </div>
    </StyleEditorSection>
  );
});

export default AdvancedSection;

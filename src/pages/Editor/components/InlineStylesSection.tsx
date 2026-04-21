import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus } from 'lucide-react';
import { useInlineStylesSection } from '@/hooks/useInlineStylesSection';
import StyleEditorSection from './StyleEditorSection';
import StyleEditorRow from './StyleEditorRow';

const InlineStylesSection = memo(() => {
  const { t } = useTranslation();
  const { parsedInlineStyle, elementId, withDebounce, flushDebounce, applyLiveInlineProp, commitInlineStyle, removeInlineProp, addInlineProp } = useInlineStylesSection();
  const [newProp, setNewProp] = useState('');
  const [newValue, setNewValue] = useState('');
  const inputCls = 'text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary outline-none focus:border-forge-terracotta font-mono';
  return (
    <StyleEditorSection title={t('inspect.sectionInlineStyles')} defaultOpen={false}>
      {Object.entries(parsedInlineStyle).map(([prop, value]) => (
        <StyleEditorRow key={prop} label={prop}>
          <div className="flex gap-1">
            <input
              key={`${elementId}-${prop}`}
              type="text"
              defaultValue={value}
              onChange={(e) => withDebounce(`il-${prop}`, () => applyLiveInlineProp(prop, e.target.value))}
              onBlur={() => { flushDebounce(`il-${prop}`); commitInlineStyle(); }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              className={`flex-1 ${inputCls}`}
            />
            <button onClick={() => removeInlineProp(prop)} className="shrink-0 text-text-muted/50 hover:text-red-400 transition cursor-pointer px-1">
              <X size={10} />
            </button>
          </div>
        </StyleEditorRow>
      ))}
      <div className="flex gap-1 mt-1">
        <input type="text" value={newProp} onChange={(e) => setNewProp(e.target.value)} placeholder={t('inspect.inlineStyleAddProp')} className={`w-24 shrink-0 ${inputCls}`} />
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && newProp.trim()) { addInlineProp(newProp, newValue); setNewProp(''); setNewValue(''); } }}
          placeholder={t('inspect.inlineStyleAddValue')}
          className={`flex-1 ${inputCls}`}
        />
        <button
          onClick={() => { if (newProp.trim()) { addInlineProp(newProp, newValue); setNewProp(''); setNewValue(''); } }}
          className="px-2 py-1 rounded bg-bg-elevated border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default transition cursor-pointer"
        >
          <Plus size={11} />
        </button>
      </div>
    </StyleEditorSection>
  );
});

export default InlineStylesSection;

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAttributeEditor } from '@/hooks/useAttributeEditor';
import StyleEditorSection from './StyleEditorSection';
import StyleEditorRow from './StyleEditorRow';

const AttributesSection = memo(() => {
  const { t } = useTranslation();
  const { editableAttrs, canEdit, attrValue, setAttrValue, commitAttr } = useAttributeEditor();

  if (!canEdit) return null;

  return (
    <StyleEditorSection title={t('inspect.sectionAttributes')} defaultOpen={true}>
      {editableAttrs.map((attr) => (
        <StyleEditorRow key={attr} label={attr}>
          <input
            type="text"
            value={attrValue(attr)}
            onChange={(e) => setAttrValue(attr, e.target.value)}
            onBlur={() => commitAttr(attr)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="w-full text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary outline-none focus:border-forge-terracotta font-mono"
          />
        </StyleEditorRow>
      ))}
    </StyleEditorSection>
  );
});

export default AttributesSection;

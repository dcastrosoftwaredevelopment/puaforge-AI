import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTextContentEditor } from '@/hooks/useTextContentEditor';
import StyleEditorSection from './StyleEditorSection';

const TextContentSection = memo(() => {
  const { t } = useTranslation();
  const { canEdit, text, setText, commitText } = useTextContentEditor();

  if (!canEdit) return null;

  return (
    <StyleEditorSection title={t('inspect.sectionText')} defaultOpen={true}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitText}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commitText();
          }
        }}
        rows={3}
        className="w-full text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary outline-none focus:border-forge-terracotta font-mono resize-none"
      />
    </StyleEditorSection>
  );
});

export default TextContentSection;

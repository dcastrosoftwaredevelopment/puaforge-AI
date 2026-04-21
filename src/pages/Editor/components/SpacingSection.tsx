import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSpacingSection } from '@/hooks/useSpacingSection';
import StyleEditorSection from './StyleEditorSection';
import StyleEditorSpacingInput from './StyleEditorSpacingInput';

const SpacingSection = memo(() => {
  const { t } = useTranslation();
  const {
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    applyClass,
    removeCategory,
  } = useSpacingSection();
  return (
    <StyleEditorSection title={t('inspect.sectionSpacing')}>
      <span className="text-[10px] text-text-muted/60 uppercase">{t('inspect.padding')}</span>
      <div className="grid grid-cols-2 gap-1">
        <StyleEditorSpacingInput
          label="T"
          value={paddingTop}
          onChange={(v) => (v ? applyClass(`pt-${v}`) : removeCategory('pt-0'))}
        />
        <StyleEditorSpacingInput
          label="R"
          value={paddingRight}
          onChange={(v) => (v ? applyClass(`pr-${v}`) : removeCategory('pr-0'))}
        />
        <StyleEditorSpacingInput
          label="B"
          value={paddingBottom}
          onChange={(v) => (v ? applyClass(`pb-${v}`) : removeCategory('pb-0'))}
        />
        <StyleEditorSpacingInput
          label="L"
          value={paddingLeft}
          onChange={(v) => (v ? applyClass(`pl-${v}`) : removeCategory('pl-0'))}
        />
      </div>
      <span className="text-[10px] text-text-muted/60 uppercase">{t('inspect.margin')}</span>
      <div className="grid grid-cols-2 gap-1">
        <StyleEditorSpacingInput
          label="T"
          value={marginTop}
          onChange={(v) => (v ? applyClass(`mt-${v}`) : removeCategory('mt-0'))}
        />
        <StyleEditorSpacingInput
          label="R"
          value={marginRight}
          onChange={(v) => (v ? applyClass(`mr-${v}`) : removeCategory('mr-0'))}
        />
        <StyleEditorSpacingInput
          label="B"
          value={marginBottom}
          onChange={(v) => (v ? applyClass(`mb-${v}`) : removeCategory('mb-0'))}
        />
        <StyleEditorSpacingInput
          label="L"
          value={marginLeft}
          onChange={(v) => (v ? applyClass(`ml-${v}`) : removeCategory('ml-0'))}
        />
      </div>
    </StyleEditorSection>
  );
});

export default SpacingSection;

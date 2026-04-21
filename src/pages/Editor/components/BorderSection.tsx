import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBorderSection } from '@/hooks/useBorderSection';
import { ROUNDED_CLASSES, BORDER_WIDTHS } from '@/utils/tailwindClasses';
import StyleEditorSection from './StyleEditorSection';
import StyleEditorRow from './StyleEditorRow';
import StyleEditorSelect from './StyleEditorSelect';
import StyleEditorColorInput from './StyleEditorColorInput';

const BorderSection = memo(() => {
  const { t } = useTranslation();
  const { rounded, borderWidth, borderColor, elementId, applyClass, onRounded, onBorderWidth } = useBorderSection();
  return (
    <StyleEditorSection title={t('inspect.sectionBorder')}>
      <StyleEditorRow label={t('inspect.rounded')}>
        <StyleEditorSelect value={rounded} onChange={onRounded} options={ROUNDED_CLASSES} />
      </StyleEditorRow>
      <StyleEditorRow label={t('inspect.borderWidth')}>
        <StyleEditorSelect value={borderWidth} onChange={onBorderWidth} options={BORDER_WIDTHS} />
      </StyleEditorRow>
      {borderWidth && borderWidth !== 'border-0' && (
        <StyleEditorRow label={t('inspect.borderColor')}>
          <StyleEditorColorInput key={`${elementId}-bdc`} value={borderColor} onChange={(v) => applyClass(v)} prefix="border-" />
        </StyleEditorRow>
      )}
    </StyleEditorSection>
  );
});

export default BorderSection;

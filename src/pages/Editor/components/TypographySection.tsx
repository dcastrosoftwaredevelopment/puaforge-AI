import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypographySection } from '@/hooks/useTypographySection';
import { useAtomValue } from 'jotai';
import { selectedElementAtom } from '@/atoms';
import { FONT_SIZES, FONT_WEIGHTS, TEXT_ALIGNS } from '@/utils/tailwindClasses';
import StyleEditorSection from './StyleEditorSection';
import StyleEditorRow from './StyleEditorRow';
import StyleEditorSelect from './StyleEditorSelect';
import StyleEditorColorInput from './StyleEditorColorInput';

const TypographySection = memo(() => {
  const { t } = useTranslation();
  const { fontSize, fontWeight, textAlign, textColor, applyClass, onFontSize, onFontWeight } = useTypographySection();
  const elementId = useAtomValue(selectedElementAtom)?.id;
  return (
    <StyleEditorSection title={t('inspect.sectionTypography')}>
      <StyleEditorRow label={t('inspect.fontSize')}>
        <StyleEditorSelect
          value={fontSize}
          onChange={onFontSize}
          options={FONT_SIZES.map((s) => ({ label: s.replace('text-', ''), value: s }))}
        />
      </StyleEditorRow>
      <StyleEditorRow label={t('inspect.fontWeight')}>
        <StyleEditorSelect
          value={fontWeight}
          onChange={onFontWeight}
          options={FONT_WEIGHTS.map((s) => ({ label: s.replace('font-', ''), value: s }))}
        />
      </StyleEditorRow>
      <StyleEditorRow label={t('inspect.textAlign')}>
        <div className="flex gap-1">
          {TEXT_ALIGNS.map((cls) => (
            <button
              key={cls}
              onClick={() => applyClass(cls)}
              className={`flex-1 py-1 rounded text-[10px] capitalize border transition cursor-pointer ${textAlign === cls ? 'border-forge-terracotta text-forge-terracotta bg-forge-terracotta/10' : 'border-border-subtle text-text-muted hover:border-border-default'}`}
            >
              {cls.replace('text-', '')}
            </button>
          ))}
        </div>
      </StyleEditorRow>
      <StyleEditorRow label={t('inspect.textColor')}>
        <StyleEditorColorInput
          key={`${elementId}-tc`}
          value={textColor}
          onChange={(v) => applyClass(v)}
          prefix="text-"
        />
      </StyleEditorRow>
    </StyleEditorSection>
  );
});

export default TypographySection;

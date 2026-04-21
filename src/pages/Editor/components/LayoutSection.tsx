import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLayoutSection } from '@/hooks/useLayoutSection';
import { DISPLAYS, FLEX_DIRS, JUSTIFY, ALIGN_ITEMS, SPACING_SCALE } from '@/utils/tailwindClasses';
import StyleEditorSection from './StyleEditorSection';
import StyleEditorRow from './StyleEditorRow';
import StyleEditorSelect from './StyleEditorSelect';

const LayoutSection = memo(() => {
  const { t } = useTranslation();
  const { display, flexDir, justify, alignItems, gap, onDisplay, onFlexDir, onJustify, onAlignItems, onGap } = useLayoutSection();
  const isFlex = display === 'flex' || display === 'inline-flex';
  return (
    <StyleEditorSection title={t('inspect.sectionLayout')}>
      <StyleEditorRow label={t('inspect.display')}>
        <StyleEditorSelect value={display} onChange={onDisplay} options={DISPLAYS} />
      </StyleEditorRow>
      {isFlex && (
        <>
          <StyleEditorRow label={t('inspect.flexDir')}>
            <StyleEditorSelect value={flexDir} onChange={onFlexDir} options={FLEX_DIRS.map((s) => ({ label: s.replace('flex-', ''), value: s }))} />
          </StyleEditorRow>
          <StyleEditorRow label={t('inspect.justify')}>
            <StyleEditorSelect value={justify} onChange={onJustify} options={JUSTIFY.map((s) => ({ label: s.replace('justify-', ''), value: s }))} />
          </StyleEditorRow>
          <StyleEditorRow label={t('inspect.alignItems')}>
            <StyleEditorSelect value={alignItems} onChange={onAlignItems} options={ALIGN_ITEMS.map((s) => ({ label: s.replace('items-', ''), value: s }))} />
          </StyleEditorRow>
          <StyleEditorRow label={t('inspect.gap')}>
            <StyleEditorSelect value={gap} onChange={onGap} options={SPACING_SCALE.map((n) => String(n))} />
          </StyleEditorRow>
        </>
      )}
    </StyleEditorSection>
  );
});

export default LayoutSection;

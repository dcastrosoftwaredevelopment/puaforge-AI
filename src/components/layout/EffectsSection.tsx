import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useEffectsSection } from '@/hooks/useEffectsSection'
import { SHADOW_CLASSES, OVERFLOWS } from '@/utils/tailwindClasses'
import StyleEditorSection from './StyleEditorSection'
import StyleEditorRow from './StyleEditorRow'
import StyleEditorSelect from './StyleEditorSelect'

const EffectsSection = memo(() => {
  const { t } = useTranslation()
  const { shadow, opacity, overflow, applyClass, onShadow, onOverflow } = useEffectsSection()
  return (
    <StyleEditorSection title={t('inspect.sectionEffects')}>
      <StyleEditorRow label={t('inspect.shadow')}>
        <StyleEditorSelect value={shadow} onChange={onShadow} options={SHADOW_CLASSES} />
      </StyleEditorRow>
      <StyleEditorRow label={t('inspect.opacity')}>
        <input type="range" min={0} max={100} step={5} value={opacity || '100'} onChange={(e) => applyClass(`opacity-${e.target.value}`)} className="w-full accent-forge-terracotta cursor-pointer" />
      </StyleEditorRow>
      <StyleEditorRow label={t('inspect.overflow')}>
        <StyleEditorSelect value={overflow} onChange={onOverflow} options={OVERFLOWS} />
      </StyleEditorRow>
    </StyleEditorSection>
  )
})

export default EffectsSection

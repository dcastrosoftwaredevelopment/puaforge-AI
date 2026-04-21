import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useColorsSection } from '@/hooks/useColorsSection'
import { useAtomValue } from 'jotai'
import { selectedElementAtom } from '@/atoms'
import StyleEditorSection from './StyleEditorSection'
import StyleEditorRow from './StyleEditorRow'
import StyleEditorColorInput from './StyleEditorColorInput'

const ColorsSection = memo(() => {
  const { t } = useTranslation()
  const { bgColor, applyClass } = useColorsSection()
  const elementId = useAtomValue(selectedElementAtom)?.id
  return (
    <StyleEditorSection title={t('inspect.sectionColors')}>
      <StyleEditorRow label={t('inspect.bgColor')}>
        <StyleEditorColorInput key={`${elementId}-bc`} value={bgColor} onChange={(v) => applyClass(v)} prefix="bg-" />
      </StyleEditorRow>
    </StyleEditorSection>
  )
})

export default ColorsSection

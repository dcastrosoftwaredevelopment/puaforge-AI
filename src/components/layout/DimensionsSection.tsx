import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDimensionsSection } from '@/hooks/useDimensionsSection'
import StyleEditorSection from './StyleEditorSection'
import StyleEditorRow from './StyleEditorRow'

const inputCls = 'w-full text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary outline-none focus:border-forge-terracotta font-mono'

const DimensionsSection = memo(() => {
  const { t } = useTranslation()
  const { width, height, maxWidth, elementId, withDebounce, flushDebounce, applyLiveClass, removeLiveCategory, commitClassName } = useDimensionsSection()
  return (
    <StyleEditorSection title={t('inspect.sectionDimensions')}>
      <StyleEditorRow label={t('inspect.width')}>
        <input key={`${elementId}-w`} type="text" defaultValue={width} onChange={(e) => withDebounce('w', () => e.target.value ? applyLiveClass(`w-${e.target.value}`) : removeLiveCategory('w-0'))} onBlur={() => { flushDebounce('w'); commitClassName() }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} placeholder="full / auto / 64" className={inputCls} />
      </StyleEditorRow>
      <StyleEditorRow label={t('inspect.height')}>
        <input key={`${elementId}-h`} type="text" defaultValue={height} onChange={(e) => withDebounce('h', () => e.target.value ? applyLiveClass(`h-${e.target.value}`) : removeLiveCategory('h-0'))} onBlur={() => { flushDebounce('h'); commitClassName() }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} placeholder="full / auto / 64" className={inputCls} />
      </StyleEditorRow>
      <StyleEditorRow label={t('inspect.maxWidth')}>
        <input key={`${elementId}-mw`} type="text" defaultValue={maxWidth} onChange={(e) => withDebounce('mw', () => e.target.value ? applyLiveClass(`max-w-${e.target.value}`) : removeLiveCategory('max-w-sm'))} onBlur={() => { flushDebounce('mw'); commitClassName() }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} placeholder="sm / lg / xl / full" className={inputCls} />
      </StyleEditorRow>
    </StyleEditorSection>
  )
})

export default DimensionsSection

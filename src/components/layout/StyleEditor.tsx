import { useAtomValue } from 'jotai'
import { Smartphone, Tablet, Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { selectedElementAtom } from '@/atoms'
import { useStyleBreakpoint } from '@/hooks/useStyleBreakpoint'
import TypographySection from './TypographySection'
import ColorsSection from './ColorsSection'
import SpacingSection from './SpacingSection'
import DimensionsSection from './DimensionsSection'
import LayoutSection from './LayoutSection'
import BorderSection from './BorderSection'
import EffectsSection from './EffectsSection'
import InlineStylesSection from './InlineStylesSection'
import AdvancedSection from './AdvancedSection'

export default function StyleEditor() {
  const { t } = useTranslation()
  const selectedElement = useAtomValue(selectedElementAtom)
  const { breakpoint, setBreakpoint } = useStyleBreakpoint()

  return (
    <div className="flex flex-col h-full overflow-y-auto text-xs">
      {selectedElement && (
        <div className="px-3 py-2 border-b border-border-subtle flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono bg-forge-terracotta/10 text-forge-terracotta border border-forge-terracotta/20 px-1.5 py-0.5 rounded">
            {selectedElement.tagName}
          </span>
          <div className="ml-auto flex items-center gap-0.5 bg-bg-elevated rounded px-1 py-0.5">
            <button onClick={() => setBreakpoint('desktop')} title={t('inspect.breakpointDesktop')} className={`p-1 rounded transition cursor-pointer ${breakpoint === 'desktop' ? 'text-forge-terracotta' : 'text-text-muted hover:text-text-secondary'}`}>
              <Monitor size={11} />
            </button>
            <button onClick={() => setBreakpoint('tablet')} title={t('inspect.breakpointTablet')} className={`p-1 rounded transition cursor-pointer ${breakpoint === 'tablet' ? 'text-forge-terracotta' : 'text-text-muted hover:text-text-secondary'}`}>
              <Tablet size={11} />
            </button>
            <button onClick={() => setBreakpoint('mobile')} title={t('inspect.breakpointMobile')} className={`p-1 rounded transition cursor-pointer ${breakpoint === 'mobile' ? 'text-forge-terracotta' : 'text-text-muted hover:text-text-secondary'}`}>
              <Smartphone size={11} />
            </button>
          </div>
        </div>
      )}
      <TypographySection />
      <ColorsSection />
      <SpacingSection />
      <DimensionsSection />
      <LayoutSection />
      <BorderSection />
      <EffectsSection />
      <InlineStylesSection />
      {selectedElement && <AdvancedSection />}
    </div>
  )
}

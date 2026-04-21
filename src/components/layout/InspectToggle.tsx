import { MousePointer2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useInspectToggle } from '@/hooks/useInspectToggle'
import Tooltip from '@/components/ui/Tooltip'

export default function InspectToggle() {
  const { t } = useTranslation()
  const { inspectMode, toggleInspect, showInspect } = useInspectToggle()

  if (!showInspect) return null

  return (
    <Tooltip content={inspectMode ? t('inspect.deactivate') : t('inspect.activate')} side="bottom" align="right">
      <button
        onClick={toggleInspect}
        className={`p-1.5 rounded-lg transition cursor-pointer ${
          inspectMode
            ? 'text-forge-terracotta bg-forge-terracotta/10'
            : 'text-forge-terracotta/60 hover:text-forge-terracotta hover:bg-forge-terracotta/10'
        }`}
      >
        <MousePointer2 size={15} />
      </button>
    </Tooltip>
  )
}

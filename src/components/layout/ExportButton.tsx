import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFiles } from '@/hooks/useFiles'
import { useProjects } from '@/hooks/useProjects'
import { downloadProject } from '@/services/downloadProject'
import Tooltip from '@/components/ui/Tooltip'

export default function ExportButton({ menuItem = false }: { menuItem?: boolean }) {
  const { files } = useFiles()
  const { activeProject } = useProjects()
  const { t } = useTranslation()

  const button = (
    <button
      onClick={() => downloadProject(files, activeProject?.name)}
      className={menuItem
        ? 'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer'
        : 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary border border-border-subtle hover:text-text-primary hover:border-border-default bg-bg-tertiary transition'}
    >
      <Download size={14} className={menuItem ? 'text-forge-terracotta/60' : ''} />
      {t('editor.export')}
    </button>
  )

  if (menuItem) return button

  return (
    <Tooltip content={t('editor.exportTooltip')} side="bottom" align="right">
      {button}
    </Tooltip>
  )
}

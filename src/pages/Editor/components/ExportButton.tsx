import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFiles } from '@/hooks/useFiles'
import { useProjects } from '@/hooks/useProjects'
import { downloadProject } from '@/services/downloadProject'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'

export default function ExportButton({ menuItem = false }: { menuItem?: boolean }) {
  const { files } = useFiles()
  const { activeProject } = useProjects()
  const { t } = useTranslation()

  if (menuItem) {
    return (
      <button
        onClick={() => downloadProject(files, activeProject?.name)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
      >
        <Download size={14} className="text-forge-terracotta/60" />
        {t('editor.export')}
      </button>
    )
  }

  return (
    <Tooltip content={t('editor.exportTooltip')} side="bottom" align="right">
      <Button
        variant="secondary"
        size="xs"
        onClick={() => downloadProject(files, activeProject?.name)}
        className="gap-1.5 text-xs"
      >
        <Download size={14} />
        {t('editor.export')}
      </Button>
    </Tooltip>
  )
}

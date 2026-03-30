import { Download } from 'lucide-react'
import { useFiles } from '@/hooks/useFiles'
import { useProjects } from '@/hooks/useProjects'
import { downloadProject } from '@/services/downloadProject'
import Tooltip from '@/components/ui/Tooltip'

export default function ExportButton() {
  const { files } = useFiles()
  const { activeProject } = useProjects()

  return (
    <Tooltip content="Baixar arquivos do projeto como .zip" side="bottom" align="right">
      <button
        onClick={() => downloadProject(files, activeProject?.name)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary border border-border-subtle hover:text-text-primary hover:border-border-default bg-bg-tertiary transition"
      >
        <Download size={14} />
        Export
      </button>
    </Tooltip>
  )
}

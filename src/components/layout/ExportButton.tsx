import { Download } from 'lucide-react'
import { useFiles } from '@/hooks/useFiles'
import { downloadProject } from '@/services/downloadProject'

export default function ExportButton() {
  const { files } = useFiles()

  return (
    <button
      onClick={() => downloadProject(files)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary border border-border-subtle hover:text-text-primary hover:border-border-default bg-bg-tertiary transition"
      title="Download projeto"
    >
      <Download size={14} />
      Export
    </button>
  )
}

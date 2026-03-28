import { Home } from 'lucide-react'
import { useProjectActions } from '@/hooks/useProjectActions'
import ViewToggle from '@/components/layout/ViewToggle'
import DeviceToggle from '@/components/layout/DeviceToggle'
import ExportButton from '@/components/layout/ExportButton'
import ProjectName from '@/components/layout/ProjectName'

export default function EditorHeader() {
  const { goHome } = useProjectActions()

  return (
    <header className="h-11 border-b border-border-subtle flex items-center justify-between px-4 shrink-0 bg-bg-secondary">
      <div className="flex items-center gap-3">
        <button
          onClick={goHome}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
          title="Voltar para projetos"
        >
          <Home size={15} />
        </button>
        <div className="w-px h-4 bg-border-subtle" />
        <ProjectName />
      </div>
      <div className="flex items-center gap-3">
        <DeviceToggle />
        <ViewToggle />
        <ExportButton />
      </div>
    </header>
  )
}

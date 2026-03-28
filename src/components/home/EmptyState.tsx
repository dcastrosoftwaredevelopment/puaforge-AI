import { Plus, FolderOpen } from 'lucide-react'

interface EmptyStateProps {
  onCreate: () => void
}

export default function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center mb-4">
        <FolderOpen size={28} className="text-text-muted" />
      </div>
      <p className="text-text-secondary text-sm mb-4">Nenhum projeto ainda</p>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 px-4 py-2 bg-bg-elevated border border-border-default hover:bg-border-default text-text-primary text-sm font-medium rounded-lg transition cursor-pointer"
      >
        <Plus size={16} />
        Criar Projeto
      </button>
    </div>
  )
}

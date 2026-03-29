import { Plus, FolderOpen } from 'lucide-react'

interface EmptyStateProps {
  onCreate: () => void
}

export default function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-forge-terracotta/10 border border-forge-terracotta/20 flex items-center justify-center mb-4">
        <FolderOpen size={28} className="text-forge-terracotta" />
      </div>
      <p className="text-text-secondary text-sm mb-4">Nenhum projeto ainda</p>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 px-4 py-2 bg-forge-terracotta/10 border border-forge-terracotta/30 hover:bg-forge-terracotta/20 text-forge-terracotta text-sm font-medium rounded-lg transition cursor-pointer"
      >
        <Plus size={16} />
        Criar Projeto
      </button>
    </div>
  )
}

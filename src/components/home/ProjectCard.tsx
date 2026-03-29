import { Trash2, Globe } from 'lucide-react'
import type { Project } from '@/atoms'

interface ProjectCardProps {
  project: Project
  hasPreview: boolean
  onOpen: () => void
  onDelete: () => void
  onPreview: () => void
}

export default function ProjectCard({ project, hasPreview, onOpen, onDelete, onPreview }: ProjectCardProps) {
  return (
    <div
      onClick={onOpen}
      className="group relative bg-bg-secondary border border-border-subtle rounded-xl p-5 cursor-pointer hover:border-border-default hover:bg-bg-elevated transition"
    >
      <h3 className="text-sm font-medium text-text-primary mb-2 pr-8">
        {project.name}
      </h3>
      <p className="text-xs text-text-muted">
        {new Date(project.updatedAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>

      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        {hasPreview && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPreview()
            }}
            className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-bg-primary transition"
            title="Abrir preview"
          >
            <Globe size={14} />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1.5 rounded-lg text-text-muted hover:text-forge-terracotta hover:bg-bg-primary transition"
          title="Excluir projeto"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

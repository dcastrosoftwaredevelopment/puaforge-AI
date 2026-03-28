import { useAtomValue } from 'jotai'
import { Plus, Trash2, FolderOpen, Layers } from 'lucide-react'
import { projectsAtom } from '@/atoms'
import { useProjectActions } from '@/hooks/useProjectActions'

export default function ProjectList() {
  const projects = useAtomValue(projectsAtom)
  const { createProject, openProject, deleteProject } = useProjectActions()

  return (
    <div className="h-screen flex bg-bg-primary">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border-subtle bg-bg-secondary flex flex-col">
        <div className="px-4 py-4 border-b border-border-subtle">
          <span className="text-sm font-semibold text-text-primary tracking-tight">
            Vibe<span className="text-accent">.</span>Platform
          </span>
        </div>

        <nav className="flex-1 px-2 py-3">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg-elevated text-text-primary text-sm font-medium cursor-pointer">
            <Layers size={15} className="text-text-secondary" />
            Projetos
          </button>

          {/* Placeholder para futuras seções */}
          {/* <button className="..."><User size={15} /> Conta</button> */}
          {/* <button className="..."><Settings size={15} /> Configurações</button> */}
        </nav>

      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">Projetos</h1>
              <p className="text-sm text-text-muted mt-1">
                {projects.length === 0
                  ? 'Crie seu primeiro projeto para começar'
                  : `${projects.length} projeto${projects.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={createProject}
              className="flex items-center gap-2 px-4 py-2 bg-bg-elevated border border-border-default hover:bg-border-default text-text-primary text-sm font-medium rounded-lg transition cursor-pointer"
            >
              <Plus size={16} />
              Novo Projeto
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center mb-4">
                <FolderOpen size={28} className="text-text-muted" />
              </div>
              <p className="text-text-secondary text-sm mb-4">Nenhum projeto ainda</p>
              <button
                onClick={createProject}
                className="flex items-center gap-2 px-4 py-2 bg-bg-elevated border border-border-default hover:bg-border-default text-text-primary text-sm font-medium rounded-lg transition cursor-pointer"
              >
                <Plus size={16} />
                Criar Projeto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => openProject(project.id)}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteProject(project.id)
                    }}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-bg-primary transition"
                    title="Excluir projeto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

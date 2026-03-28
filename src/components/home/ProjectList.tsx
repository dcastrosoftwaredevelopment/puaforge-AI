import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { useProjectActions } from '@/hooks/useProjectActions'
import { db, dbReady } from '@/services/db'
import Sidebar from '@/components/home/Sidebar'
import EmptyState from '@/components/home/EmptyState'
import ProjectCard from '@/components/home/ProjectCard'

export default function ProjectList() {
  const { projects } = useProjects()
  const { createProject, openProject, deleteProject } = useProjectActions()
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    dbReady.then(async () => {
      const sites = await db.publishedSites.toArray()
      setPublishedIds(new Set(sites.map((s) => s.projectId)))
    })
  }, [projects])

  const openPreview = async (projectId: string) => {
    const site = await db.publishedSites.get(projectId)
    if (!site) return
    const blob = new Blob([site.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div className="h-screen flex bg-bg-primary">
      <Sidebar />

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
            <EmptyState onCreate={createProject} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  hasPreview={publishedIds.has(project.id)}
                  onOpen={() => openProject(project.id)}
                  onDelete={() => deleteProject(project.id)}
                  onPreview={() => openPreview(project.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

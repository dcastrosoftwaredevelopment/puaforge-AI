import { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useAtomValue } from 'jotai'
import { useTranslation } from 'react-i18next'
import { authTokenAtom } from '@/atoms/authAtoms'
import { useProjects } from '@/hooks/useProjects'
import { useProjectActions } from '@/hooks/useProjectActions'
import { api } from '@/services/api'
import Sidebar from '@/components/home/Sidebar'
import EmptyState from '@/components/home/EmptyState'
import ProjectCard from '@/components/home/ProjectCard'

export default function ProjectList() {
  const { projects } = useProjects()
  const { createProject, openProject, deleteProject } = useProjectActions()
  const token = useAtomValue(authTokenAtom)
  const { t } = useTranslation()
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!token || projects.length === 0) return
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all(
      projects.map((p) =>
        api.get<{ publishedAt: number }>(`/api/projects/${p.id}/published`, headers)
          .then(() => p.id)
          .catch(() => null),
      ),
    ).then((ids) => setPublishedIds(new Set(ids.filter(Boolean) as string[])))
  }, [projects, token])

  const openPreview = useCallback(async (projectId: string) => {
    if (!token) return
    const site = await api.get<{ html: string; publishedAt: number }>(
      `/api/projects/${projectId}/published`,
      { Authorization: `Bearer ${token}` },
    ).catch(() => null)
    if (!site) return
    const blob = new Blob([site.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }, [token])

  return (
    <div className="h-screen flex bg-bg-primary">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">{t('projects.title')}</h1>
              <p className="text-sm text-text-muted mt-1">
                {projects.length === 0
                  ? t('projects.emptyHint')
                  : t('projects.count', { count: projects.length })}
              </p>
            </div>
            <button
              onClick={createProject}
              className="flex items-center gap-2 px-4 py-2 bg-forge-terracotta/10 border border-forge-terracotta/30 hover:bg-forge-terracotta/20 text-forge-terracotta text-sm font-medium rounded-lg transition cursor-pointer"
            >
              <Plus size={16} />
              {t('projects.newProject')}
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

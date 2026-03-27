import { useCallback } from 'react'
import { useSetAtom } from 'jotai'
import { db, dbReady } from '@/services/db'
import {
  projectsAtom,
  activeProjectIdAtom,
  messagesAtom,
  filesAtom,
  appViewAtom,
  type Project,
} from '@/atoms'
import { depsAtom } from '@/hooks/useFiles'
import { DEFAULT_FILES } from '@/utils/defaultFiles'
import { generateProjectName } from '@/utils/projectNames'

export function useProjectActions() {
  const setProjects = useSetAtom(projectsAtom)
  const setActiveProjectId = useSetAtom(activeProjectIdAtom)
  const setMessages = useSetAtom(messagesAtom)
  const setFiles = useSetAtom(filesAtom)
  const setDeps = useSetAtom(depsAtom)
  const setAppView = useSetAtom(appViewAtom)

  const createProject = useCallback(async () => {
    await dbReady
    const project: Project = {
      id: crypto.randomUUID(),
      name: generateProjectName(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await db.projects.add(project)
    setProjects((prev) => [project, ...prev])
    setActiveProjectId(project.id)
    setMessages([])
    setFiles(DEFAULT_FILES)
    setDeps({})
    setAppView('editor')
    return project
  }, [setProjects, setActiveProjectId, setMessages, setFiles, setDeps, setAppView])

  const openProject = useCallback(async (id: string) => {
    setActiveProjectId(id)
    setAppView('editor')
  }, [setActiveProjectId, setAppView])

  const deleteProject = useCallback(async (id: string) => {
    await Promise.all([
      db.projects.delete(id),
      db.messages.where('projectId').equals(id).delete(),
      db.projectFiles.where('projectId').equals(id).delete(),
    ])
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [setProjects])

  const renameProject = useCallback(async (id: string, name: string) => {
    await db.projects.update(id, { name, updatedAt: Date.now() })
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, name } : p))
  }, [setProjects])

  const goHome = useCallback(() => {
    setActiveProjectId(null)
    setAppView('home')
    db.settings.delete('activeProjectId')
  }, [setActiveProjectId, setAppView])

  return { createProject, openProject, deleteProject, renameProject, goHome }
}

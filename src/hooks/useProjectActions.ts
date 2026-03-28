import { useCallback } from 'react'
import { useSetAtom } from 'jotai'
import { useNavigate } from 'react-router-dom'
import { db, dbReady } from '@/services/db'
import {
  projectsAtom,
  activeProjectIdAtom,
  messagesAtom,
  filesAtom,
  projectImagesAtom,
  checkpointsAtom,
  type Project,
} from '@/atoms'
import { depsAtom } from '@/hooks/useFiles'
import { DEFAULT_FILES } from '@/utils/defaultFiles'
import { generateProjectName } from '@/utils/projectNames'

export function useProjectActions() {
  const navigate = useNavigate()
  const setProjects = useSetAtom(projectsAtom)
  const setActiveProjectId = useSetAtom(activeProjectIdAtom)
  const setMessages = useSetAtom(messagesAtom)
  const setFiles = useSetAtom(filesAtom)
  const setDeps = useSetAtom(depsAtom)
  const setProjectImages = useSetAtom(projectImagesAtom)
  const setCheckpoints = useSetAtom(checkpointsAtom)

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

    // Clear state before navigating to new project
    setActiveProjectId(project.id)
    setMessages([])
    setFiles(DEFAULT_FILES)
    setDeps({})
    setProjectImages([])
    setCheckpoints([])

    navigate(`/project/${project.id}`)
    return project
  }, [navigate, setProjects, setActiveProjectId, setMessages, setFiles, setDeps, setProjectImages, setCheckpoints])

  const openProject = useCallback((id: string) => {
    navigate(`/project/${id}`)
  }, [navigate])

  const deleteProject = useCallback(async (id: string) => {
    await Promise.all([
      db.projects.delete(id),
      db.messages.where('projectId').equals(id).delete(),
      db.projectFiles.where('projectId').equals(id).delete(),
      db.projectImages.where('projectId').equals(id).delete(),
      db.checkpoints.where('projectId').equals(id).delete(),
    ])
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [setProjects])

  const renameProject = useCallback(async (id: string, name: string) => {
    await db.projects.update(id, { name, updatedAt: Date.now() })
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, name } : p))
  }, [setProjects])

  const goHome = useCallback(() => {
    setActiveProjectId(null)
    db.settings.delete('activeProjectId')
    navigate('/')
  }, [navigate, setActiveProjectId])

  return { createProject, openProject, deleteProject, renameProject, goHome }
}

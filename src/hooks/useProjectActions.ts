import { useCallback, useMemo } from 'react'
import { useSetAtom, useAtomValue } from 'jotai'
import { useNavigate } from 'react-router-dom'
import { authTokenAtom } from '@/atoms/authAtoms'
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
import { api } from '@/services/api'

export function useProjectActions() {
  const navigate = useNavigate()
  const token = useAtomValue(authTokenAtom)
  const setProjects = useSetAtom(projectsAtom)
  const setActiveProjectId = useSetAtom(activeProjectIdAtom)
  const setMessages = useSetAtom(messagesAtom)
  const setFiles = useSetAtom(filesAtom)
  const setDeps = useSetAtom(depsAtom)
  const setProjectImages = useSetAtom(projectImagesAtom)
  const setCheckpoints = useSetAtom(checkpointsAtom)

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token],
  )

  const createProject = useCallback(async () => {
    if (!authHeaders) return
    const project: Project = {
      id: crypto.randomUUID(),
      name: generateProjectName(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await api.post('/api/projects', project, authHeaders)
    setProjects((prev) => [project, ...prev])

    setActiveProjectId(project.id)
    setMessages([])
    setFiles(DEFAULT_FILES)
    setDeps({})
    setProjectImages([])
    setCheckpoints([])

    navigate(`/project/${project.id}`)
    return project
  }, [authHeaders, navigate, setProjects, setActiveProjectId, setMessages, setFiles, setDeps, setProjectImages, setCheckpoints])

  const openProject = useCallback((id: string) => {
    navigate(`/project/${id}`)
  }, [navigate])

  const deleteProject = useCallback(async (id: string) => {
    if (!authHeaders) return
    await api.delete(`/api/projects/${id}`, authHeaders)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [authHeaders, setProjects])

  const renameProject = useCallback(async (id: string, name: string) => {
    if (!authHeaders) return
    await api.patch(`/api/projects/${id}`, { name }, authHeaders)
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, name } : p))
  }, [authHeaders, setProjects])

  const goHome = useCallback(() => {
    setActiveProjectId(null)
    navigate('/')
  }, [navigate, setActiveProjectId])

  return { createProject, openProject, deleteProject, renameProject, goHome }
}

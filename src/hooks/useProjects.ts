import { useAtomValue } from 'jotai'
import { projectsAtom, activeProjectIdAtom } from '@/atoms'

export function useProjects() {
  const projects = useAtomValue(projectsAtom)
  const activeProjectId = useAtomValue(activeProjectIdAtom)
  const activeProject = projects.find((p) => p.id === activeProjectId)

  return { projects, activeProjectId, activeProject }
}

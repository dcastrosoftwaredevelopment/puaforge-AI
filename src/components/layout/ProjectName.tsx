import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useAtomValue } from 'jotai'
import { Pencil } from 'lucide-react'
import { projectsAtom, activeProjectIdAtom } from '@/atoms'
import { useProjectActions } from '@/hooks/useProjectActions'

export default function ProjectName() {
  const projects = useAtomValue(projectsAtom)
  const activeId = useAtomValue(activeProjectIdAtom)
  const { renameProject } = useProjectActions()

  const project = projects.find((p) => p.id === activeId)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  if (!project) return null

  const startEditing = () => {
    setName(project.name)
    setIsEditing(true)
  }

  const save = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== project.name) {
      renameProject(project.id, trimmed)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') setIsEditing(false)
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        className="bg-bg-tertiary border border-border-default rounded-md px-3 py-1 text-sm text-text-primary outline-none focus:border-accent w-64"
      />
    )
  }

  return (
    <button
      onClick={startEditing}
      className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition group"
      title="Clique para renomear"
    >
      <span className="truncate max-w-64">{project.name}</span>
      <Pencil size={11} className="text-text-muted opacity-0 group-hover:opacity-100 transition" />
    </button>
  )
}

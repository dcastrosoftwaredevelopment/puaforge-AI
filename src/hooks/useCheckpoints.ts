import { useCallback } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { activeProjectIdAtom, checkpointsAtom, type Checkpoint } from '@/atoms'
import { useFiles } from '@/hooks/useFiles'
import { db } from '@/services/db'
import { extractDependencies } from '@/services/fileParser'

export function useCheckpoints() {
  const [checkpoints, setCheckpoints] = useAtom(checkpointsAtom)
  const activeProjectId = useAtomValue(activeProjectIdAtom)
  const { files, setFiles, setDeps } = useFiles()

  const createCheckpoint = useCallback(async (name: string) => {
    if (!activeProjectId) return
    const checkpoint: Checkpoint = {
      id: crypto.randomUUID(),
      name: name.trim() || `Checkpoint ${checkpoints.length + 1}`,
      files: { ...files },
      createdAt: Date.now(),
    }
    await db.checkpoints.add({ ...checkpoint, projectId: activeProjectId })
    setCheckpoints((prev) => [checkpoint, ...prev])
  }, [activeProjectId, files, checkpoints.length, setCheckpoints])

  const restoreCheckpoint = useCallback(async (id: string) => {
    const checkpoint = checkpoints.find((c) => c.id === id)
    if (!checkpoint) return
    setFiles(checkpoint.files)
    const deps = extractDependencies(checkpoint.files)
    setDeps(Object.keys(deps).length > 0 ? deps : {})
  }, [checkpoints, setFiles, setDeps])

  const deleteCheckpoint = useCallback(async (id: string) => {
    await db.checkpoints.delete(id)
    setCheckpoints((prev) => prev.filter((c) => c.id !== id))
  }, [setCheckpoints])

  const renameCheckpoint = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    await db.checkpoints.update(id, { name: trimmed })
    setCheckpoints((prev) => prev.map((c) => c.id === id ? { ...c, name: trimmed } : c))
  }, [setCheckpoints])

  return { checkpoints, createCheckpoint, restoreCheckpoint, deleteCheckpoint, renameCheckpoint }
}

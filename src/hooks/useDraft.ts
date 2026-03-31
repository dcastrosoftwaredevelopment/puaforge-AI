import { useCallback, useEffect, useRef, useState } from 'react'
import { useAtomValue } from 'jotai'
import { activeProjectIdAtom, messagesAtom, filesAtom, projectLoadedAtom, type Message } from '@/atoms'

import { authTokenAtom } from '@/atoms/authAtoms'
import { db, dbReady } from '@/services/db'
import { api } from '@/services/api'

/**
 * Auto-saves messages and files to IndexedDB (draft) in real-time.
 * isDraft = true means there are local changes not yet saved to PostgreSQL.
 */
export function useDraft() {
  const activeProjectId = useAtomValue(activeProjectIdAtom)
  const token = useAtomValue(authTokenAtom)
  const messagesValue = useAtomValue(messagesAtom)
  const filesValue = useAtomValue(filesAtom)
  const projectLoaded = useAtomValue(projectLoadedAtom)
  const [isDraft, setIsDraft] = useState(false)

  // Skip the first save triggered by the initial project load (not a user change).
  // Each ref is cleared after the first save attempt following a project change.
  const ignoreNextMessagesRef = useRef(true)
  const ignoreNextFilesRef = useRef(true)

  // On project change: check for existing draft and arm the ignore guards
  useEffect(() => {
    if (!activeProjectId) return
    ignoreNextMessagesRef.current = true
    ignoreNextFilesRef.current = true
    hasDraft(activeProjectId).then((exists) => { setIsDraft(exists) })
  }, [activeProjectId])

  // Auto-save messages to IndexedDB — only after project is fully loaded
  useEffect(() => {
    if (!projectLoaded || !activeProjectId) return
    if (ignoreNextMessagesRef.current) {
      ignoreNextMessagesRef.current = false
      return
    }
    const pid = activeProjectId
    const entries = messagesValue.map((m) => ({ ...m, projectId: pid }))
    dbReady.then(() =>
      db.transaction('rw', db.messages, async () => {
        await db.messages.where('projectId').equals(pid).delete()
        await db.messages.bulkPut(entries)
      }),
    ).then(() => setIsDraft(true))
     .catch((e) => console.error('[draft] messages save error:', e))
  }, [messagesValue, activeProjectId, projectLoaded])

  // Auto-save files to IndexedDB — only after project is fully loaded
  useEffect(() => {
    if (!projectLoaded || !activeProjectId) return
    if (ignoreNextFilesRef.current) {
      ignoreNextFilesRef.current = false
      return
    }
    const pid = activeProjectId
    const entries = Object.entries(filesValue).map(([path, code]) => ({
      projectId: pid,
      path,
      code,
      updatedAt: Date.now(),
    }))
    dbReady.then(() =>
      db.transaction('rw', db.projectFiles, async () => {
        await db.projectFiles.where('projectId').equals(pid).delete()
        await db.projectFiles.bulkAdd(entries)
      }),
    ).then(() => setIsDraft(true))
     .catch((e) => console.error('[draft] files save error:', e))
  }, [filesValue, activeProjectId, projectLoaded])

  /** Persist current state (messages + files) to PostgreSQL and clear local draft */
  const saveDraft = useCallback(async () => {
    if (!activeProjectId || !token) return
    const headers = { Authorization: `Bearer ${token}` }
    const pid = activeProjectId
    await Promise.all([
      api.put(`/api/projects/${pid}/messages`, { msgs: messagesValue }, headers),
      api.put(`/api/projects/${pid}/files`, filesValue, headers),
      dbReady.then(() => Promise.all([
        db.messages.where('projectId').equals(pid).delete(),
        db.projectFiles.where('projectId').equals(pid).delete(),
      ])),
    ])
    setIsDraft(false)
  }, [activeProjectId, token, messagesValue, filesValue])

  /** Delete local IndexedDB draft — next load will come from PostgreSQL */
  const discardDraft = useCallback(async () => {
    if (!activeProjectId) return
    await dbReady
    await Promise.all([
      db.messages.where('projectId').equals(activeProjectId).delete(),
      db.projectFiles.where('projectId').equals(activeProjectId).delete(),
    ])
    setIsDraft(false)
  }, [activeProjectId])

  return { isDraft, saveDraft, discardDraft }
}

/** Returns true if a local draft exists for the given projectId */
export async function hasDraft(projectId: string): Promise<boolean> {
  await dbReady
  const count = await db.messages.where('projectId').equals(projectId).count()
  if (count > 0) return true
  const fileCount = await db.projectFiles.where('projectId').equals(projectId).count()
  return fileCount > 0
}

/** Load draft data from IndexedDB for the given projectId */
export async function loadDraft(projectId: string): Promise<{
  messages: Message[]
  files: Record<string, string>
} | null> {
  await dbReady
  const savedMessages = await db.messages
    .where('projectId')
    .equals(projectId)
    .sortBy('timestamp')

  const savedFiles = await db.projectFiles
    .where('projectId')
    .equals(projectId)
    .toArray()

  if (savedMessages.length === 0 && savedFiles.length === 0) return null

  const files: Record<string, string> = {}
  for (const f of savedFiles) files[f.path] = f.code

  return {
    messages: savedMessages.map(({ projectId: _, ...m }) => m) as Message[],
    files,
  }
}

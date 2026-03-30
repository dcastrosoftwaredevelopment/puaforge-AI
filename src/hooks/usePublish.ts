import { useCallback, useEffect, useState } from 'react'
import { useAtomValue } from 'jotai'
import { activeProjectIdAtom } from '@/atoms'
import { useFiles } from '@/hooks/useFiles'
import { useApiCall, HttpMethod } from '@/hooks/useApiCall'
import { db, dbReady } from '@/services/db'

export function usePublish() {
  const activeProjectId = useAtomValue(activeProjectIdAtom)
  const { files } = useFiles()
  const [publishedAt, setPublishedAt] = useState<number | null>(null)

  const { loading: isPublishing, error, execute: callPublish } = useApiCall<
    { projectId: string | null; files: Record<string, string> },
    { html: string; publishedAt: number }
  >(HttpMethod.POST, '/api/publish')

  useEffect(() => {
    if (!activeProjectId) return
    dbReady.then(async () => {
      const site = await db.publishedSites.get(activeProjectId)
      setPublishedAt(site?.publishedAt ?? null)
    })
  }, [activeProjectId])

  const publish = useCallback(async () => {
    if (!activeProjectId || isPublishing) return

    const data = await callPublish({ projectId: activeProjectId, files })
    if (!data) return

    await db.publishedSites.put({
      projectId: activeProjectId,
      html: data.html,
      publishedAt: data.publishedAt,
    })

    setPublishedAt(data.publishedAt)
  }, [activeProjectId, files, isPublishing, callPublish])

  const openPublished = useCallback(async () => {
    if (!activeProjectId) return
    const site = await db.publishedSites.get(activeProjectId)
    if (!site) return

    const blob = new Blob([site.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }, [activeProjectId])

  return { isPublishing, publishedAt, error, publish, openPublished }
}

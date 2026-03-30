import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAtomValue } from 'jotai'
import { activeProjectIdAtom } from '@/atoms'
import { authTokenAtom } from '@/atoms/authAtoms'
import { useFiles } from '@/hooks/useFiles'
import { useApiCall, HttpMethod } from '@/hooks/useApiCall'
import { api } from '@/services/api'

export function usePublish() {
  const activeProjectId = useAtomValue(activeProjectIdAtom)
  const token = useAtomValue(authTokenAtom)
  const { files } = useFiles()
  const [publishedAt, setPublishedAt] = useState<number | null>(null)

  const { loading: isPublishing, error, execute: callPublish } = useApiCall<
    { projectId: string | null; files: Record<string, string> },
    { html: string; publishedAt: number }
  >(HttpMethod.POST, '/api/publish')

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token],
  )

  // Load published state from API on project change
  useEffect(() => {
    if (!activeProjectId || !authHeaders) return
    api.get<{ html: string; publishedAt: number }>(
      `/api/projects/${activeProjectId}/published`,
      authHeaders,
    )
      .then((site) => setPublishedAt(site.publishedAt))
      .catch(() => setPublishedAt(null))
  }, [activeProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const publish = useCallback(async () => {
    if (!activeProjectId || isPublishing || !authHeaders) return

    const data = await callPublish({ projectId: activeProjectId, files })
    if (!data) return

    // Store the published HTML in the DB
    await api.put(
      `/api/projects/${activeProjectId}/published`,
      { html: data.html, publishedAt: data.publishedAt },
      authHeaders,
    )

    setPublishedAt(data.publishedAt)
  }, [activeProjectId, authHeaders, files, isPublishing, callPublish])

  const openPublished = useCallback(async () => {
    if (!activeProjectId || !authHeaders) return
    const site = await api.get<{ html: string; publishedAt: number }>(
      `/api/projects/${activeProjectId}/published`,
      authHeaders,
    ).catch(() => null)
    if (!site) return

    const blob = new Blob([site.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }, [activeProjectId, authHeaders])

  return { isPublishing, publishedAt, error, publish, openPublished }
}

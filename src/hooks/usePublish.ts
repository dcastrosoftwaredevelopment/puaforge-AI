import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAtomValue } from 'jotai'
import { activeProjectIdAtom } from '@/atoms'
import { authTokenAtom } from '@/atoms/authAtoms'
import { useFiles } from '@/hooks/useFiles'
import { useApiCall, HttpMethod } from '@/hooks/useApiCall'
import { api } from '@/services/api'
import { usePlanLimit } from '@/hooks/usePlanLimit'

export function usePublish() {
  const activeProjectId = useAtomValue(activeProjectIdAtom)
  const token = useAtomValue(authTokenAtom)
  const { files } = useFiles()
  const [publishedAt, setPublishedAt] = useState<number | null>(null)
  const [subdomain, setSubdomain] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const withPlanLimit = usePlanLimit()
  const { loading: isPublishing, error: buildError, execute: callPublish } = useApiCall<
    { projectId: string | null; files: Record<string, string> },
    { html: string; publishedAt: number }
  >(HttpMethod.POST, '/api/publish')

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token],
  )

  const error = buildError ?? saveError

  // Load published state from API on project change
  useEffect(() => {
    if (!activeProjectId || !authHeaders) return
    setSaveError(null)
    api.get<{ html: string; publishedAt: number; subdomain: string | null }>(
      `/api/projects/${activeProjectId}/published`,
      authHeaders,
    )
      .then((site) => {
        setPublishedAt(site.publishedAt)
        setSubdomain(site.subdomain ?? null)
      })
      .catch(() => {
        setPublishedAt(null)
        setSubdomain(null)
      })
  }, [activeProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const publish = useCallback(async () => {
    if (!activeProjectId || isPublishing || !authHeaders) return
    setSaveError(null)

    const data = await withPlanLimit(() => callPublish({ projectId: activeProjectId, files }))
    if (!data) return

    try {
      // Store the published HTML in the DB
      const result = await api.put<{ ok: boolean; subdomain: string | null }>(
        `/api/projects/${activeProjectId}/published`,
        { html: data.html, publishedAt: data.publishedAt },
        authHeaders,
      )
      setPublishedAt(data.publishedAt)
      if (result.subdomain) setSubdomain(result.subdomain)
    } catch (e) {
      console.error('[publish] save error:', e)
      setSaveError(e instanceof Error ? e.message : 'Erro ao salvar publicação')
    }
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

  // Called by useSubdomain after a successful subdomain save so the UI updates immediately
  const onSubdomainSaved = useCallback((slug: string) => {
    setSubdomain(slug)
  }, [])

  return { isPublishing, publishedAt, subdomain, error, publish, openPublished, setSaveError, onSubdomainSaved }
}

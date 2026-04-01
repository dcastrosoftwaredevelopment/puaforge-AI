import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAtomValue } from 'jotai'
import { activeProjectIdAtom } from '@/atoms'
import { authTokenAtom } from '@/atoms/authAtoms'
import { useFiles } from '@/hooks/useFiles'
import { useApiCall, HttpMethod } from '@/hooks/useApiCall'
import { api } from '@/services/api'
import { db, dbReady } from '@/services/db'
import { usePlanLimit } from '@/hooks/usePlanLimit'
import { track } from '@/lib/analytics'

export function usePublish() {
  const { t } = useTranslation()
  const activeProjectId = useAtomValue(activeProjectIdAtom)
  const token = useAtomValue(authTokenAtom)
  const { files } = useFiles()
  const [publishedAt, setPublishedAt] = useState<number | null>(null)
  const [subdomainPublishedAt, setSubdomainPublishedAt] = useState<number | null>(null)
  const [subdomain, setSubdomain] = useState<string | null>(null)
  const [localPublishedAt, setLocalPublishedAt] = useState<number | null>(null)
  const [domainSaveError, setDomainSaveError] = useState<string | null>(null)
  const [subdomainSaveError, setSubdomainSaveError] = useState<string | null>(null)
  const [isSavingToDomain, setIsSavingToDomain] = useState(false)
  const [isSavingToSubdomain, setIsSavingToSubdomain] = useState(false)
  const [isPublishingLocally, setIsPublishingLocally] = useState(false)

  const withPlanLimit = usePlanLimit()
  const { loading: isGenerating, execute: callPublish } = useApiCall<
    { projectId: string | null; files: Record<string, string> },
    { html: string; publishedAt: number }
  >(HttpMethod.POST, '/api/publish')

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token],
  )

  const isPublishingToDomain = isSavingToDomain
  const isPublishingToSubdomain = isSavingToSubdomain
  const isBusy = isGenerating || isSavingToDomain || isSavingToSubdomain

  // Load remote published state + local IndexedDB state on project change
  useEffect(() => {
    if (!activeProjectId || !authHeaders) return
    setDomainSaveError(null)
    setSubdomainSaveError(null)

    api.get<{ publishedAt: number | null; subdomainPublishedAt: number | null; subdomain: string | null }>(
      `/api/projects/${activeProjectId}/published`,
      authHeaders,
    )
      .then((site) => {
        setPublishedAt(site.publishedAt ?? null)
        setSubdomainPublishedAt(site.subdomainPublishedAt ?? null)
        setSubdomain(site.subdomain ?? null)
      })
      .catch(() => {
        setPublishedAt(null)
        setSubdomainPublishedAt(null)
        setSubdomain(null)
      })

    dbReady.then(() => db.publishedSites.get(activeProjectId)).then((local) => {
      setLocalPublishedAt(local?.publishedAt ?? null)
    }).catch(() => {})
  }, [activeProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Publish to custom domain (production) */
  const publish = useCallback(async () => {
    if (!activeProjectId || isBusy || !authHeaders) return
    setDomainSaveError(null)
    setIsSavingToDomain(true)

    try {
      const data = await withPlanLimit(() => callPublish({ projectId: activeProjectId, files }, authHeaders))
      if (!data) return
      await api.put(
        `/api/projects/${activeProjectId}/published`,
        { html: data.html, publishedAt: data.publishedAt },
        authHeaders,
      )
      setPublishedAt(data.publishedAt)
      track('publish_domain', { first_time: publishedAt === null })
    } catch (e) {
      console.error('[publish] domain save error:', e)
      setDomainSaveError(t('publish.saveError'))
    } finally {
      setIsSavingToDomain(false)
    }
  }, [activeProjectId, authHeaders, files, isBusy, callPublish, withPlanLimit, t, publishedAt])

  /** Publish to subdomain (temporary URL) */
  const publishToSubdomain = useCallback(async () => {
    if (!activeProjectId || isBusy || !authHeaders) return
    setSubdomainSaveError(null)
    setIsSavingToSubdomain(true)

    try {
      const data = await withPlanLimit(() => callPublish({ projectId: activeProjectId, files }, authHeaders))
      if (!data) return
      await api.put(
        `/api/projects/${activeProjectId}/published/subdomain`,
        { html: data.html, publishedAt: data.publishedAt },
        authHeaders,
      )
      setSubdomainPublishedAt(data.publishedAt)
      track('publish_subdomain', { first_time: subdomainPublishedAt === null })
    } catch (e) {
      console.error('[publish] subdomain save error:', e)
      setSubdomainSaveError(t('publish.saveError'))
    } finally {
      setIsSavingToSubdomain(false)
    }
  }, [activeProjectId, authHeaders, files, isBusy, callPublish, withPlanLimit, t, subdomainPublishedAt])

  /** Generate HTML and save to IndexedDB — no server write, no plan limit */
  const publishLocally = useCallback(async () => {
    if (!activeProjectId || !authHeaders || isPublishingLocally) return
    setIsPublishingLocally(true)
    try {
      const data = await api.post<{ html: string; publishedAt: number }>(
        '/api/publish',
        { projectId: activeProjectId, files },
        authHeaders,
      )
      await dbReady
      await db.publishedSites.put({ projectId: activeProjectId, html: data.html, publishedAt: data.publishedAt })
      setLocalPublishedAt(data.publishedAt)
    } catch (e) {
      console.error('[publish] local save error:', e)
    } finally {
      setIsPublishingLocally(false)
    }
  }, [activeProjectId, authHeaders, files, isPublishingLocally])

  /** Open the locally saved HTML as a blob URL */
  const openLocalPreview = useCallback(async () => {
    if (!activeProjectId) return
    await dbReady
    const local = await db.publishedSites.get(activeProjectId)
    if (!local?.html) return
    const blob = new Blob([local.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }, [activeProjectId])

  // Called by useSubdomain after a successful slug save so the UI updates immediately
  const onSubdomainSaved = useCallback((slug: string) => {
    setSubdomain(slug)
  }, [])

  return {
    isBusy,
    isPublishingToDomain,
    isPublishingToSubdomain,
    isPublishingLocally,
    publishedAt,
    subdomainPublishedAt,
    localPublishedAt,
    subdomain,
    domainError: domainSaveError,
    subdomainError: subdomainSaveError,
    publish,
    publishToSubdomain,
    publishLocally,
    openLocalPreview,
    onSubdomainSaved,
  }
}

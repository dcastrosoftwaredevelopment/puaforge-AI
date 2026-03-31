import { useCallback, useEffect, useRef, useState } from 'react'
import { useAtomValue } from 'jotai'
import { activeProjectIdAtom } from '@/atoms'
import { authTokenAtom } from '@/atoms/authAtoms'
import { useTranslation } from 'react-i18next'
import { api, ApiError, PlanLimitError } from '@/services/api'
import { useSetAtom } from 'jotai'
import { upgradePromptAtom } from '@/atoms'

/** Regex that matches valid subdomain slugs: lowercase letters, digits, hyphens; no leading/trailing/double hyphens */
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/

export type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export function useSubdomain(publishedSubdomain: string | null, onSaved?: (slug: string) => void) {
  const activeProjectId = useAtomValue(activeProjectIdAtom)
  const token = useAtomValue(authTokenAtom)
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined

  const { t } = useTranslation()
  const setUpgradePrompt = useSetAtom(upgradePromptAtom)
  const [slugInput, setSlugInput] = useState('')
  const [status, setStatus] = useState<SlugStatus>('idle')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset input when project changes
  useEffect(() => {
    setSlugInput('')
    setStatus('idle')
    setSaveError(null)
  }, [activeProjectId])

  const handleSlugChange = useCallback((value: string) => {
    // Mask: only allow a-z0-9 and hyphens, auto-lowercase
    const masked = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlugInput(masked)
    setSaveError(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!masked) {
      setStatus('idle')
      return
    }

    if (!SLUG_REGEX.test(masked) || masked.includes('--')) {
      setStatus('invalid')
      return
    }

    // If the user typed back the current subdomain, no need to check
    if (masked === publishedSubdomain) {
      setStatus('available')
      return
    }

    setStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await api.get<{ available: boolean; reason?: string }>(
          `/api/subdomains/check?slug=${encodeURIComponent(masked)}`,
        )
        if (result.reason === 'invalid') {
          setStatus('invalid')
        } else {
          setStatus(result.available ? 'available' : 'taken')
        }
      } catch {
        setStatus('idle')
      }
    }, 400)
  }, [publishedSubdomain])

  const saveSubdomain = useCallback(async () => {
    if (!activeProjectId || !authHeaders || status !== 'available') return
    setSaving(true)
    setSaveError(null)
    try {
      await api.put(
        `/api/projects/${activeProjectId}/subdomain`,
        { subdomain: slugInput },
        authHeaders,
      )
      onSaved?.(slugInput)
      setSlugInput('')
      setStatus('idle')
    } catch (e) {
      if (e instanceof PlanLimitError) {
        setUpgradePrompt({ requiredPlan: e.requiredPlan, limitType: e.limitType, message: '' })
      } else if (e instanceof ApiError && e.status === 409) {
        setStatus('taken')
      } else {
        setSaveError(t('publish.subdomainSaveError'))
      }
    } finally {
      setSaving(false)
    }
  }, [activeProjectId, authHeaders, slugInput, status])

  return {
    slugInput,
    status,
    saving,
    saveError,
    handleSlugChange,
    saveSubdomain,
  }
}

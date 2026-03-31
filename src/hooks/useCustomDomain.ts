import { useCallback } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { customDomainAtom, activeProjectIdAtom } from '@/atoms'
import { authTokenAtom } from '@/atoms/authAtoms'
import { api } from '@/services/api'

export function useCustomDomain() {
  const [customDomain, setCustomDomain] = useAtom(customDomainAtom)
  const activeProjectId = useAtomValue(activeProjectIdAtom)
  const token = useAtomValue(authTokenAtom)

  const saveDomain = useCallback(async (domain: string | null) => {
    if (!activeProjectId || !token) return

    const normalized = domain?.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '') || null

    if (normalized) {
      // Must be a valid hostname: labels separated by dots, no spaces, valid chars
      const valid = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(normalized)
      if (!valid) throw new Error('Domínio inválido. Use o formato: meu-site.com')
    }

    await api.put(
      `/api/projects/${activeProjectId}/domain`,
      { customDomain: normalized },
      { Authorization: `Bearer ${token}` },
    )
    setCustomDomain(normalized)
  }, [activeProjectId, token, setCustomDomain])

  return { customDomain, setCustomDomain, saveDomain }
}

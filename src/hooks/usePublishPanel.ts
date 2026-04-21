import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/services/api'
import { PlanLimitUIError } from '@/hooks/usePlanLimit'

export function usePublishPanel(customDomain: string | null, saveDomain: (domain: string | null, force?: boolean) => Promise<void>) {
  const { t } = useTranslation()
  const [showPanel, setShowPanel] = useState(false)
  const [domainInput, setDomainInput] = useState('')
  const [savingDomain, setSavingDomain] = useState(false)
  const [domainInputError, setDomainInputError] = useState<string | null>(null)
  const [domainSaved, setDomainSaved] = useState(false)
  const [ownProjectConflict, setOwnProjectConflict] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showPanel) setDomainInput(customDomain ?? '')
  }, [showPanel, customDomain])

  useEffect(() => {
    if (!showPanel) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPanel])

  const handleSaveDomain = async (force = false) => {
    setSavingDomain(true)
    setDomainInputError(null)
    setOwnProjectConflict(null)
    try {
      await saveDomain(domainInput || null, force)
      setDomainSaved(true)
      setTimeout(() => setDomainSaved(false), 2000)
    } catch (e) {
      if (e instanceof PlanLimitUIError) {
        setDomainInputError(t('publish.domainLimitReached'))
      } else if (e instanceof ApiError && e.code === 'DOMAIN_OWN_PROJECT') {
        setOwnProjectConflict(e.data?.conflictingProjectName as string ?? '')
      } else if (e instanceof ApiError && e.status === 409) {
        setDomainInputError(t('publish.domainTaken'))
      } else {
        setDomainInputError(t('publish.domainSaveError'))
      }
    } finally {
      setSavingDomain(false)
    }
  }

  return {
    showPanel, setShowPanel,
    domainInput, setDomainInput,
    savingDomain,
    domainInputError,
    domainSaved,
    ownProjectConflict, setOwnProjectConflict,
    panelRef,
    handleSaveDomain,
  }
}

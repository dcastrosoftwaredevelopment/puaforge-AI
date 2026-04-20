import { useState, useEffect } from 'react'
import { Key, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useApiKey } from '@/hooks/useApiKey'
import { useModels } from '@/hooks/useModels'
import { useApiCall, HttpMethod } from '@/hooks/useApiCall'
import Sidebar, { SidebarMenuButton } from '@/components/home/Sidebar'
import Button from '@/components/ui/Button'

export default function Settings() {
  const { apiKey, setApiKey, apiKeyEnabled, setApiKeyEnabled } = useApiKey()
  const { refetchModels } = useModels()
  const { t } = useTranslation()
  const [draft, setDraft] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)
  const [validated, setValidated] = useState<boolean | null>(null)

  useEffect(() => {
    setDraft(apiKey)
  }, [apiKey])

  const hasChanges = draft !== apiKey

  const { loading: validating, error: validationError, execute: validateKey } =
    useApiCall<{ apiKey: string }, { valid: boolean; error?: string }>(HttpMethod.POST, '/api/settings/validate-key')

  const handleValidate = async () => {
    if (!draft.trim()) return
    setValidated(null)
    const result = await validateKey({ apiKey: draft.trim() })
    setValidated(result ? result.valid : false)
  }

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (trimmed && validated !== true) {
      const result = await validateKey({ apiKey: trimmed })
      const isValid = result ? result.valid : false
      setValidated(isValid)
      if (!isValid) return
    }
    setApiKey(trimmed)
    if (trimmed) refetchModels()
    setValidated(null)
  }

  const handleClear = () => {
    setDraft('')
    setApiKey('')
    setApiKeyEnabled(true)
    setValidated(null)
  }

  const handleToggleEnabled = () => {
    setApiKeyEnabled(!apiKeyEnabled)
    refetchModels()
  }

  return (
    <div className="h-screen flex bg-bg-primary">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle md:hidden">
          <SidebarMenuButton />
          <img src="/Logo PuaForge.png" alt="PuaForge AI" style={{ height: '20px', width: 'auto' }} />
        </div>
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">{t('settings.title')}</h1>
            <p className="text-sm text-text-muted mt-1">{t('settings.subtitle')}</p>
          </div>

          {/* API Key Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Key size={16} className="text-forge-terracotta" />
                <h2 className="text-base font-semibold text-text-primary">{t('settings.apiKeySection')}</h2>
              </div>
              {apiKey && (
                <button
                  onClick={handleToggleEnabled}
                  className={`relative w-9 h-5 rounded-full transition cursor-pointer ${
                    apiKeyEnabled ? 'bg-accent' : 'bg-bg-elevated border border-border-subtle'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-bg-primary transition-transform ${
                      apiKeyEnabled ? 'left-[18px]' : 'left-0.5'
                    }`}
                  />
                </button>
              )}
            </div>
            <p className="text-sm text-text-secondary leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
              {t('settings.apiKeyDescription')}
            </p>

            {apiKey && !apiKeyEnabled && (
              <div className="text-xs text-forge-terracotta bg-forge-terracotta/10 border border-forge-terracotta/20 rounded-lg px-3 py-2">
                {t('settings.apiKeyDisabledWarning')}
              </div>
            )}

            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    setValidated(null)
                  }}
                  placeholder={t('settings.apiKeyPlaceholder')}
                  className="w-full bg-bg-tertiary border border-border-subtle rounded-lg px-3 py-2.5 pr-10 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-default transition font-mono"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition cursor-pointer"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Validation status */}
              {validated === true && (
                <div className="flex items-center gap-2 text-xs text-vibe-blue">
                  <CheckCircle2 size={13} />
                  {t('settings.apiKeyValid')}
                </div>
              )}
              {validated === false && (
                <div className="flex items-center gap-2 text-xs text-forge-terracotta">
                  <XCircle size={13} />
                  {validationError || t('settings.apiKeyInvalid')}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={validating}
                  onClick={handleValidate}
                  disabled={!draft.trim()}
                >
                  {t('settings.validate')}
                </Button>
                <Button
                  variant="blue"
                  size="sm"
                  isLoading={validating}
                  onClick={handleSave}
                  disabled={!hasChanges}
                >
                  {t('settings.save')}
                </Button>
                {apiKey && (
                  <Button variant="terracotta" size="sm" onClick={handleClear}>
                    {t('settings.remove')}
                  </Button>
                )}
              </div>

              {apiKey && !hasChanges && apiKeyEnabled && (
                <p className="text-xs text-text-muted">
                  {t('settings.apiKeyActive')}
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

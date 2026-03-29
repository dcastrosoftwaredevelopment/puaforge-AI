import { useState } from 'react'
import { Key, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useApiKey } from '@/hooks/useApiKey'
import { useModels } from '@/hooks/useModels'
import Sidebar from '@/components/home/Sidebar'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid'

export default function Settings() {
  const { apiKey, setApiKey, apiKeyEnabled, setApiKeyEnabled } = useApiKey()
  const { refetchModels } = useModels()
  const [draft, setDraft] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)
  const [validation, setValidation] = useState<ValidationState>('idle')
  const [validationError, setValidationError] = useState('')

  const hasChanges = draft !== apiKey

  const handleValidate = async () => {
    if (!draft.trim()) return
    setValidation('validating')
    setValidationError('')
    try {
      const res = await fetch(`${API_URL}/api/settings/validate-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: draft.trim() }),
      })
      const data = await res.json()
      if (data.valid) {
        setValidation('valid')
      } else {
        setValidation('invalid')
        setValidationError(data.error || 'Chave inválida')
      }
    } catch {
      setValidation('invalid')
      setValidationError('Erro ao conectar com o servidor')
    }
  }

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (trimmed && validation !== 'valid') {
      await handleValidate()
      return
    }
    setApiKey(trimmed)
    if (trimmed) refetchModels()
    setValidation('idle')
  }

  const handleClear = () => {
    setDraft('')
    setApiKey('')
    setApiKeyEnabled(true)
    setValidation('idle')
    setValidationError('')
  }

  const handleToggleEnabled = () => {
    setApiKeyEnabled(!apiKeyEnabled)
    refetchModels()
  }

  return (
    <div className="h-screen flex bg-bg-primary">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-8 py-10 space-y-8">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Configurações</h1>
            <p className="text-sm text-text-muted mt-1">Gerencie as configurações da plataforma</p>
          </div>

          {/* API Key Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Key size={16} className="text-forge-terracotta" />
                <h2 className="text-base font-semibold text-text-primary">Claude API Key</h2>
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
            <p className="text-sm text-text-secondary leading-relaxed">
              Configure sua chave da API do Claude para usar a plataforma.
              A chave é necessária para gerar código e listar os modelos disponíveis.
            </p>

            {apiKey && !apiKeyEnabled && (
              <div className="text-xs text-forge-terracotta bg-forge-terracotta/10 border border-forge-terracotta/20 rounded-lg px-3 py-2">
                Chave desabilitada. A geração de código e listagem de modelos não funcionarão até habilitar novamente.
              </div>
            )}

            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    setValidation('idle')
                    setValidationError('')
                  }}
                  placeholder="sk-ant-api03-..."
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
              {validation === 'valid' && (
                <div className="flex items-center gap-2 text-xs text-vibe-blue">
                  <CheckCircle2 size={13} />
                  Chave válida
                </div>
              )}
              {validation === 'invalid' && (
                <div className="flex items-center gap-2 text-xs text-forge-terracotta">
                  <XCircle size={13} />
                  {validationError}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleValidate}
                  disabled={!draft.trim() || validation === 'validating'}
                  className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:bg-border-default disabled:opacity-30 transition cursor-pointer flex items-center gap-2"
                >
                  {validation === 'validating' && <Loader2 size={13} className="animate-spin" />}
                  Validar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || validation === 'validating'}
                  className="px-3 py-1.5 rounded-lg bg-accent/20 border border-accent/30 text-sm text-accent hover:bg-accent/30 disabled:opacity-30 transition cursor-pointer"
                >
                  Salvar
                </button>
                {apiKey && (
                  <button
                    onClick={handleClear}
                    className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-sm text-forge-terracotta hover:bg-forge-terracotta/10 hover:border-forge-terracotta/30 transition cursor-pointer"
                  >
                    Remover chave
                  </button>
                )}
              </div>

              {apiKey && !hasChanges && apiKeyEnabled && (
                <p className="text-xs text-text-muted">
                  Chave configurada e ativa. As requisições usarão esta chave ao invés da chave do servidor.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

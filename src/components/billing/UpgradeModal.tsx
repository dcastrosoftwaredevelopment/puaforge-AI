import { useAtom } from 'jotai'
import { X, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { upgradePromptAtom } from '@/atoms'

export default function UpgradeModal() {
  const [prompt, setPrompt] = useAtom(upgradePromptAtom)
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (!prompt) return null

  const planLabel = prompt.requiredPlan === 'indie' ? 'Indie' : 'Pro'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-bg-secondary border border-border-default rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Zap size={15} className="text-forge-terracotta" />
            {t('upgrade.title')}
          </div>
          <button
            onClick={() => setPrompt(null)}
            className="p-1 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">{prompt.message}</p>

          <div className="p-3 rounded-lg bg-forge-terracotta/5 border border-forge-terracotta/20 text-xs text-forge-terracotta">
            {t('upgrade.requiredPlan', { plan: planLabel })}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setPrompt(null)}
              className="flex-1 py-2 rounded-lg text-sm text-text-secondary border border-border-subtle hover:bg-bg-elevated transition cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => { setPrompt(null); navigate('/billing') }}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-forge-terracotta/10 text-forge-terracotta border border-forge-terracotta/30 hover:bg-forge-terracotta/20 transition cursor-pointer"
            >
              {t('upgrade.seePlans')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { X, ArrowRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { upgradePromptAtom } from '@/atoms'
import { track } from '@/lib/analytics'

const LIMIT_TYPE_MAP: Record<string, string> = {
  projects: 'projects',
  publish: 'publish',
  customDomain: 'customDomain',
  imports: 'imports',
  storage: 'storage',
  checkpoints: 'checkpoints',
}

export default function UpgradeModal() {
  const [prompt, setPrompt] = useAtom(upgradePromptAtom)
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    if (!prompt) return
    track('upgrade_modal_view', { limit_type: prompt.limitType, required_plan: prompt.requiredPlan })
  }, [prompt])

  if (!prompt) return null

  const planLabel = prompt.requiredPlan === 'indie' ? 'Indie' : 'Pro'
  const limitKey = LIMIT_TYPE_MAP[prompt.limitType] ?? 'unknown'
  const limitMessage = t(`upgrade.limits.${limitKey}`)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-bg-secondary border border-border-subtle rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">

        {/* Top accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-vibe-blue/40 to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-vibe-blue/10 border border-vibe-blue/20 flex items-center justify-center shrink-0">
              <Sparkles size={15} className="text-vibe-blue" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{t('upgrade.title')}</p>
              <p className="text-[11px] text-text-muted mt-0.5">
                {t('upgrade.requiredPlanPrefix')}{' '}
                <span className="font-semibold text-vibe-blue">{planLabel}</span>
                {t('upgrade.requiredPlanSuffix') ? ` ${t('upgrade.requiredPlanSuffix')}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setPrompt(null)}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer mt-0.5"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            {limitMessage}
          </p>

          {/* Plan hint */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-bg-elevated border border-border-subtle">
            <div className="w-1.5 h-1.5 rounded-full bg-vibe-blue shrink-0" />
            <p className="text-xs text-text-muted leading-relaxed">
              {t('billing.plans.' + prompt.requiredPlan)} — {prompt.requiredPlan === 'indie' ? 'R$39/mês' : 'R$99/mês'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => { track('upgrade_modal_dismiss', { limit_type: prompt.limitType }); setPrompt(null) }}
              className="flex-1 py-2 rounded-lg text-xs text-text-muted border border-border-subtle hover:bg-bg-elevated hover:text-text-secondary transition cursor-pointer"
            >
              {t('upgrade.maybeLater')}
            </button>
            <button
              onClick={() => { track('upgrade_modal_see_plans', { limit_type: prompt.limitType }); setPrompt(null); navigate('/billing') }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-vibe-blue/10 text-vibe-blue border border-vibe-blue/20 hover:bg-vibe-blue/15 transition cursor-pointer"
            >
              {t('upgrade.seePlans')}
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

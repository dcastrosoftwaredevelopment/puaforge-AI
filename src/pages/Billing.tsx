import { useState } from 'react'
import { Check, Zap, Rocket, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Sidebar from '@/components/home/Sidebar'
import { useUsage, usePlansConfig, formatBytes, formatLimit } from '@/hooks/useUsage'

interface PlanFeature {
  text: string
  available: boolean
}

interface Plan {
  key: 'free' | 'indie' | 'pro'
  price: string
  period: string
  icon: React.ReactNode
  color: string
  borderColor: string
  badgeColor: string
  current: boolean
  comingSoon: boolean
  features: PlanFeature[]
}

function UsageRow({ label, used, limit, unit }: { label: string; used: number; limit: number; unit?: string }) {
  const isUnlimited = limit === Infinity || limit >= 1e9
  const pct = isUnlimited ? 0 : Math.min(100, (used / limit) * 100)
  const isWarning = pct >= 80
  const usedLabel = unit === 'bytes' ? formatBytes(used) : String(used)
  const limitLabel = formatLimit(limit, unit)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className={`font-mono ${isWarning ? 'text-yellow-400' : 'text-text-muted'}`}>
          {usedLabel}{!isUnlimited && ` / ${limitLabel}`}{isUnlimited && ` / ${limitLabel}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1 bg-bg-primary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isWarning ? 'bg-yellow-400' : 'bg-forge-terracotta/60'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default function Billing() {
  const { t } = useTranslation()
  const { data: usage } = useUsage()
  const plansConfig = usePlansConfig()
  const [interested, setInterested] = useState<Record<string, boolean>>({})

  function lim(n: number, unit?: 'bytes'): string {
    if (n === Infinity) return '∞'
    if (unit === 'bytes') return formatBytes(n)
    return String(n)
  }

  const f = plansConfig

  const plans: Plan[] = [
    {
      key: 'free',
      price: 'R$0',
      period: t('billing.forever'),
      icon: <Zap size={18} />,
      color: 'text-text-secondary',
      borderColor: 'border-border-default',
      badgeColor: 'bg-bg-elevated text-text-secondary border-border-subtle',
      current: usage?.plan === 'free' || !usage,
      comingSoon: false,
      features: [
        { text: t('billing.features.projects', { count: lim(f?.free.maxProjects ?? 1) }), available: true },
        { text: t('billing.features.preview'), available: true },
        { text: t('billing.features.export'), available: true },
        { text: t('billing.features.publish'), available: f?.free.canPublish ?? false },
        { text: t('billing.features.domain', { count: lim(f?.free.maxCustomDomains ?? 0) }), available: (f?.free.maxCustomDomains ?? 0) > 0 },
        { text: t('billing.features.import', { count: lim(f?.free.maxImportsPerMonth ?? 0) }), available: (f?.free.maxImportsPerMonth ?? 0) > 0 },
        { text: t('billing.features.storage', { size: lim(f?.free.maxStorageBytes ?? 0, 'bytes') }), available: (f?.free.maxStorageBytes ?? 0) > 0 },
        { text: t('billing.features.checkpoints', { count: lim(f?.free.maxCheckpointsPerProject ?? 0) }), available: (f?.free.maxCheckpointsPerProject ?? 0) > 0 },
      ],
    },
    {
      key: 'indie',
      price: 'R$39',
      period: t('billing.perMonth'),
      icon: <Rocket size={18} />,
      color: 'text-vibe-blue',
      borderColor: 'border-vibe-blue/30',
      badgeColor: 'bg-vibe-blue/10 text-vibe-blue border-vibe-blue/20',
      current: usage?.plan === 'indie',
      comingSoon: true,
      features: [
        { text: t('billing.features.projects', { count: lim(f?.indie.maxProjects ?? 3) }), available: true },
        { text: t('billing.features.preview'), available: true },
        { text: t('billing.features.export'), available: true },
        { text: t('billing.features.publish'), available: f?.indie.canPublish ?? true },
        { text: t('billing.features.domain', { count: lim(f?.indie.maxCustomDomains ?? 1) }), available: true },
        { text: t('billing.features.import', { count: lim(f?.indie.maxImportsPerMonth ?? 3) }), available: true },
        { text: t('billing.features.storage', { size: lim(f?.indie.maxStorageBytes ?? 0, 'bytes') }), available: true },
        { text: t('billing.features.checkpoints', { count: lim(f?.indie.maxCheckpointsPerProject ?? 10) }), available: true },
      ],
    },
    {
      key: 'pro',
      price: 'R$99',
      period: t('billing.perMonth'),
      icon: <Sparkles size={18} />,
      color: 'text-forge-terracotta',
      borderColor: 'border-forge-terracotta/30',
      badgeColor: 'bg-forge-terracotta/10 text-forge-terracotta border-forge-terracotta/20',
      current: usage?.plan === 'pro',
      comingSoon: true,
      features: [
        { text: t('billing.features.projects', { count: lim(f?.pro.maxProjects ?? Infinity) }), available: true },
        { text: t('billing.features.preview'), available: true },
        { text: t('billing.features.export'), available: true },
        { text: t('billing.features.publish'), available: f?.pro.canPublish ?? true },
        { text: t('billing.features.domains', { count: lim(f?.pro.maxCustomDomains ?? 5) }), available: true },
        { text: t('billing.features.import', { count: lim(f?.pro.maxImportsPerMonth ?? Infinity) }), available: true },
        { text: t('billing.features.storage', { size: lim(f?.pro.maxStorageBytes ?? 0, 'bytes') }), available: true },
        { text: t('billing.features.checkpoints', { count: lim(f?.pro.maxCheckpointsPerProject ?? Infinity) }), available: true },
      ],
    },
  ]

  const handleInterest = (planKey: string) => {
    setInterested((prev) => ({ ...prev, [planKey]: true }))
  }

  return (
    <div className="h-screen w-screen bg-bg-primary flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-10">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-text-primary">{t('billing.title')}</h1>
            <p className="text-sm text-text-muted mt-1">{t('billing.subtitle')}</p>
          </div>

          {usage && (
            <div className="mb-8 p-5 rounded-xl border border-border-subtle bg-bg-secondary space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-text-primary">{t('billing.currentUsage')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wide bg-forge-terracotta/10 text-forge-terracotta border-forge-terracotta/20">
                  {usage.plan === 'free' ? t('billing.plans.free') : usage.plan === 'indie' ? 'Indie' : 'Pro'}
                </span>
              </div>
              <UsageRow
                label={t('sidebar.usageProjects')}
                used={usage.usage.projects.used}
                limit={usage.usage.projects.limit}
              />
              <UsageRow
                label={t('sidebar.usageStorage')}
                used={usage.usage.storageBytes.used}
                limit={usage.usage.storageBytes.limit}
                unit="bytes"
              />
              <UsageRow
                label={t('sidebar.usageImports')}
                used={usage.usage.importsThisMonth.used}
                limit={usage.usage.importsThisMonth.limit}
              />
              <UsageRow
                label={t('billing.usageDomains')}
                used={usage.usage.customDomains.used}
                limit={usage.usage.customDomains.limit}
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={`relative flex flex-col rounded-xl border bg-bg-secondary p-5 ${plan.borderColor} ${plan.current ? 'ring-1 ring-border-default' : ''}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex items-center gap-2 font-semibold text-sm ${plan.color}`}>
                    {plan.icon}
                    {t(`billing.plans.${plan.key}`)}
                  </div>
                  {plan.current && (
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${plan.badgeColor}`}>
                      {t('billing.currentPlan')}
                    </span>
                  )}
                  {plan.comingSoon && (
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${plan.badgeColor}`}>
                      {t('billing.comingSoon')}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mb-5">
                  <span className="text-3xl font-bold text-text-primary">{plan.price}</span>
                  <span className="text-xs text-text-muted ml-1">{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-2.5 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className={`mt-0.5 shrink-0 ${feature.available ? plan.color : 'text-text-muted'}`}>
                        {feature.available
                          ? <Check size={13} />
                          : <span className="block w-3 h-[1px] bg-current mt-2" />}
                      </span>
                      <span className={`text-xs leading-relaxed ${feature.available ? 'text-text-secondary' : 'text-text-muted line-through'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.current ? (
                  <div className="py-2 text-center text-xs text-text-muted border border-border-subtle rounded-lg">
                    {t('billing.activePlan')}
                  </div>
                ) : interested[plan.key] ? (
                  <div className={`py-2 text-center text-xs rounded-lg border ${plan.badgeColor}`}>
                    {t('billing.interestConfirmed')}
                  </div>
                ) : (
                  <button
                    onClick={() => handleInterest(plan.key)}
                    className={`py-2 text-sm font-medium rounded-lg border transition cursor-pointer ${plan.badgeColor} hover:opacity-80`}
                  >
                    {t('billing.notifyMe')}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p className="text-xs text-text-muted text-center mt-8 leading-relaxed">
            {t('billing.byokNote')}
          </p>
        </div>
      </main>
    </div>
  )
}

import { useState, useEffect } from 'react';
import { Zap, Rocket, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Sidebar, { SidebarMenuButton } from '@/components/sidebar/Sidebar';
import { useUsage, usePlansConfig, formatBytes } from '@/hooks/useUsage';
import { track } from '@/lib/analytics';
import UsageSection from './components/UsageSection';
import PlanCard, { type BillingPlan } from './components/PlanCard';

export default function Billing() {
  const { t } = useTranslation();
  const { data: usage } = useUsage();
  const plansConfig = usePlansConfig();
  const [interested, setInterested] = useState<Record<string, boolean>>({});

  useEffect(() => { track('billing_page_view'); }, []);

  function lim(n: number, unit?: 'bytes'): string {
    if (n === Infinity) return '∞';
    if (unit === 'bytes') return formatBytes(n);
    return String(n);
  }

  const f = plansConfig;

  const plans: BillingPlan[] = [
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
        { text: t('billing.features.publish', { count: lim(f?.free.maxPublishedSites ?? 1) }), available: true },
        { text: t('billing.features.domain', { count: lim(f?.free.maxCustomDomains ?? 0) }), available: (f?.free.maxCustomDomains ?? 0) > 0 },
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
        { text: t('billing.features.publish', { count: lim(f?.indie.maxPublishedSites ?? 1) }), available: true },
        { text: t('billing.features.domain', { count: lim(f?.indie.maxCustomDomains ?? 1) }), available: true },
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
        { text: t('billing.features.publish', { count: lim(f?.pro.maxPublishedSites ?? 5) }), available: true },
        { text: t('billing.features.domains', { count: lim(f?.pro.maxCustomDomains ?? 5) }), available: true },
        { text: t('billing.features.storage', { size: lim(f?.pro.maxStorageBytes ?? 0, 'bytes') }), available: true },
        { text: t('billing.features.checkpoints', { count: lim(f?.pro.maxCheckpointsPerProject ?? Infinity) }), available: true },
      ],
    },
  ];

  const handleInterest = (planKey: string) => {
    setInterested((prev) => ({ ...prev, [planKey]: true }));
    track('plan_interest_click', { plan: planKey });
  };

  return (
    <div className="h-screen w-screen bg-bg-primary flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle md:hidden">
          <SidebarMenuButton />
          <img src="/Logo PuaForge.png" alt="PuaForge AI" style={{ height: '20px', width: 'auto' }} />
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-text-primary">{t('billing.title')}</h1>
            <p className="text-sm text-text-muted mt-1">{t('billing.subtitle')}</p>
          </div>

          {usage && <UsageSection usage={usage} />}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                interested={!!interested[plan.key]}
                onInterestClick={() => handleInterest(plan.key)}
              />
            ))}
          </div>

          <p className="text-xs text-text-muted text-center mt-8 leading-relaxed">
            {t('billing.byokNote')}
          </p>
        </div>
      </main>
    </div>
  );
}

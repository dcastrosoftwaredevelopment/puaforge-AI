import { useTranslation } from 'react-i18next';
import type { UserUsage } from '@/hooks/useUsage';
import UsageRow from './UsageRow';

export default function UsageSection({ usage }: { usage: UserUsage }) {
  const { t } = useTranslation();
  return (
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
        label={t('billing.usageDomains')}
        used={usage.usage.customDomains.used}
        limit={usage.usage.customDomains.limit}
      />
      <UsageRow
        label={t('billing.usagePublishedSites')}
        used={usage.usage.publishedSites.used}
        limit={usage.usage.publishedSites.limit}
      />
    </div>
  );
}

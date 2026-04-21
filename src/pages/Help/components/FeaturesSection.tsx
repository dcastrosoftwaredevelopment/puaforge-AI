import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';

const featureKeys = [1, 2, 3, 4] as const;

export default function FeaturesSection() {
  const { t } = useTranslation();
  return (
    <section className="bg-bg-secondary border border-border-subtle rounded-xl p-5 space-y-5">
      <div className="flex items-center gap-2.5">
        <CheckCircle2 size={15} className="text-forge-terracotta" />
        <h2 className="text-sm font-semibold text-text-primary">{t('help.features_title')}</h2>
      </div>
      <div className="space-y-5 divide-y divide-border-subtle">
        {featureKeys.map((n) => (
          <div key={n} className="space-y-1 pt-4 first:pt-0 first:border-t-0">
            <p className="text-xs font-semibold text-text-primary">{t(`help.features_${n}_title`)}</p>
            <p className="text-xs text-text-secondary leading-relaxed">{t(`help.features_${n}_desc`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

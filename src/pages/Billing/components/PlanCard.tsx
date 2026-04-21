import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

export interface PlanFeature {
  text: string;
  available: boolean;
}

export interface BillingPlan {
  key: 'free' | 'indie' | 'pro';
  price: string;
  period: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  badgeColor: string;
  current: boolean;
  comingSoon: boolean;
  features: PlanFeature[];
}

interface Props {
  plan: BillingPlan;
  interested: boolean;
  onInterestClick: () => void;
}

export default function PlanCard({ plan, interested, onInterestClick }: Props) {
  const { t } = useTranslation();
  return (
    <div
      className={`relative flex flex-col rounded-xl border bg-bg-secondary p-5 ${plan.borderColor} ${plan.current ? 'ring-1 ring-border-default' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-2 font-semibold text-sm ${plan.color}`}>
          {plan.icon}
          {t(`billing.plans.${plan.key}`)}
        </div>
        {plan.current && (
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${plan.badgeColor}`}
          >
            {t('billing.currentPlan')}
          </span>
        )}
        {plan.comingSoon && !plan.current && (
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${plan.badgeColor}`}
          >
            {t('billing.comingSoon')}
          </span>
        )}
      </div>

      <div className="mb-5">
        <span className="text-3xl font-bold text-text-primary">{plan.price}</span>
        <span className="text-xs text-text-muted ml-1">{plan.period}</span>
      </div>

      <ul className="flex-1 space-y-2.5 mb-6">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className={`mt-0.5 shrink-0 ${feature.available ? plan.color : 'text-text-muted'}`}>
              {feature.available ? <Check size={13} /> : <span className="block w-3 h-[1px] bg-current mt-2" />}
            </span>
            <span
              className={`text-xs leading-relaxed ${feature.available ? 'text-text-secondary' : 'text-text-muted line-through'}`}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      {plan.current ? (
        <div className="py-2 text-center text-xs text-text-muted border border-border-subtle rounded-lg">
          {t('billing.activePlan')}
        </div>
      ) : interested ? (
        <div className={`py-2 text-center text-xs rounded-lg border ${plan.badgeColor}`}>
          {t('billing.interestConfirmed')}
        </div>
      ) : (
        <button
          onClick={onInterestClick}
          className={`py-2 text-sm font-medium rounded-lg border transition cursor-pointer ${plan.badgeColor} hover:opacity-80`}
        >
          {t('billing.notifyMe')}
        </button>
      )}
    </div>
  );
}

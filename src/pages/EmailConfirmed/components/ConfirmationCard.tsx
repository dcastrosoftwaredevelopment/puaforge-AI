import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

type State = 'verifying' | 'success' | 'error';

interface Props {
  state: State;
  email: string;
  onRequestNew: () => void;
  onBackToLogin: () => void;
}

export default function ConfirmationCard({ state, email, onRequestNew, onBackToLogin }: Props) {
  const { t } = useTranslation();
  return (
    <div className="bg-bg-secondary border border-border-subtle rounded-2xl p-6 flex flex-col items-center text-center gap-4">
      {state === 'verifying' && (
        <>
          <Loader2 size={32} className="animate-spin text-forge-terracotta" />
          <p className="text-sm text-text-muted">{t('emailConfirmed.verifying')}</p>
        </>
      )}

      {state === 'success' && (
        <>
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle size={26} className="text-success" />
          </div>
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-text-primary">{t('emailConfirmed.success')}</h1>
            <p className="text-xs text-text-muted">{t('emailConfirmed.successMessage')}</p>
          </div>
          <Loader2 size={16} className="animate-spin text-text-muted" />
        </>
      )}

      {state === 'error' && (
        <>
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
            <XCircle size={26} className="text-red-400" />
          </div>
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-text-primary">{t('emailConfirmed.invalidToken')}</h1>
            <p className="text-xs text-text-muted">{t('emailConfirmed.invalidTokenMessage')}</p>
          </div>
          {email && (
            <button
              onClick={onRequestNew}
              className="w-full py-2 rounded-lg bg-forge-terracotta text-white text-sm font-medium hover:bg-forge-terracotta/90 transition cursor-pointer"
            >
              {t('emailConfirmed.requestNew')}
            </button>
          )}
          <button
            onClick={onBackToLogin}
            className="text-xs text-text-muted hover:text-text-primary transition cursor-pointer"
          >
            {t('emailConfirmed.backToLogin')}
          </button>
        </>
      )}
    </div>
  );
}

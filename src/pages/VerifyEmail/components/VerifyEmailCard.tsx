import { useNavigate } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  maskedEmail: string;
  email: string;
  cooldown: number;
  resendState: 'idle' | 'loading' | 'success' | 'error' | 'recentlySent';
  handleResend: (email: string) => void;
}

export default function VerifyEmailCard({ maskedEmail, email, cooldown, resendState, handleResend }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="bg-bg-secondary border border-border-subtle rounded-2xl p-6 flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 rounded-full bg-forge-terracotta/10 flex items-center justify-center">
        <Mail size={26} className="text-forge-terracotta" />
      </div>

      <div className="space-y-1">
        <h1 className="text-base font-semibold text-text-primary">{t('verifyEmail.title')}</h1>
        <p className="text-xs text-text-muted">
          {t('verifyEmail.subtitle')} <span className="text-text-primary font-medium">{maskedEmail}</span>
        </p>
      </div>

      <p className="text-xs text-text-muted leading-relaxed">{t('verifyEmail.instruction')}</p>
      <p className="text-[11px] text-text-muted/70">{t('verifyEmail.spamHint')}</p>

      {resendState === 'success' && (
        <div className="flex items-center gap-1.5 text-xs text-success">
          <CheckCircle size={13} />
          {t('verifyEmail.resendSuccess')}
        </div>
      )}
      {resendState === 'error' && <p className="text-xs text-red-400">{t('verifyEmail.resendError')}</p>}
      {resendState === 'recentlySent' && (
        <p className="text-xs text-yellow-400">{t('verifyEmail.resendRecentlySent')}</p>
      )}

      <button
        onClick={() => handleResend(email)}
        disabled={cooldown > 0 || resendState === 'loading'}
        className="w-full py-2 rounded-lg bg-bg-elevated border border-border-subtle text-xs text-text-secondary hover:text-text-primary hover:border-border-default transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
      >
        {resendState === 'loading' && <Loader2 size={13} className="animate-spin" />}
        {cooldown > 0 ?
          t('verifyEmail.resendCooldown', { seconds: cooldown })
        : resendState === 'loading' ?
          t('verifyEmail.resending')
        : t('verifyEmail.resend')}
      </button>

      <button
        onClick={() => navigate('/login')}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition cursor-pointer"
      >
        <ArrowLeft size={13} />
        {t('verifyEmail.backToLogin')}
      </button>
    </div>
  );
}

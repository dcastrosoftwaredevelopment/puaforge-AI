import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/api'

const RESEND_COOLDOWN = 60

export default function VerifyEmail() {
  const { t } = useTranslation()
  const { resendVerification } = useAuth()
  const navigate = useNavigate()

  const email = sessionStorage.getItem('verify_email') ?? ''
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + b.replace(/./g, '•') + c)

  const [cooldown, setCooldown] = useState(0)
  const [resendState, setResendState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN)
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleResend = async () => {
    if (!email || cooldown > 0) return
    setResendState('loading')
    try {
      await resendVerification(email)
      setResendState('success')
      startCooldown()
    } catch (err) {
      const code = err instanceof ApiError ? err.code : ''
      if (code === 'ERROR_ALREADY_VERIFIED') {
        navigate('/login')
        return
      }
      setResendState('error')
    }
  }

  return (
    <div className="h-screen w-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8 text-2xl font-semibold">
          <span className="text-vibe-blue">PuaForge</span>
          <span className="text-forge-terracotta">AI</span>
        </div>

        <div className="bg-bg-secondary border border-border-subtle rounded-2xl p-6 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-forge-terracotta/10 flex items-center justify-center">
            <Mail size={26} className="text-forge-terracotta" />
          </div>

          <div className="space-y-1">
            <h1 className="text-base font-semibold text-text-primary">{t('verifyEmail.title')}</h1>
            <p className="text-xs text-text-muted">
              {t('verifyEmail.subtitle')}{' '}
              <span className="text-text-primary font-medium">{maskedEmail}</span>
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
          {resendState === 'error' && (
            <p className="text-xs text-red-400">{t('verifyEmail.resendError')}</p>
          )}

          <button
            onClick={handleResend}
            disabled={cooldown > 0 || resendState === 'loading'}
            className="w-full py-2 rounded-lg bg-bg-elevated border border-border-subtle text-xs text-text-secondary hover:text-text-primary hover:border-border-default transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {resendState === 'loading' && <Loader2 size={13} className="animate-spin" />}
            {cooldown > 0
              ? t('verifyEmail.resendCooldown', { seconds: cooldown })
              : resendState === 'loading'
                ? t('verifyEmail.resending')
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
      </div>
    </div>
  )
}

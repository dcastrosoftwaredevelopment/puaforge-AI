import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/api'

type State = 'verifying' | 'success' | 'error'

export default function EmailConfirmed() {
  const { t } = useTranslation()
  const { verifyEmail } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [state, setState] = useState<State>('verifying')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const token = searchParams.get('token')
    if (!token) {
      setState('error')
      return
    }

    verifyEmail(token)
      .then(() => {
        setState('success')
        setTimeout(() => navigate('/', { replace: true }), 1500)
      })
      .catch((err) => {
        const code = err instanceof ApiError ? err.code : ''
        if (code !== 'ERROR_ALREADY_VERIFIED') {
          setState('error')
          return
        }
        // Already verified — just redirect to login
        navigate('/login', { replace: true })
      })
  }, [searchParams, verifyEmail, navigate])

  const email = sessionStorage.getItem('verify_email') ?? ''

  return (
    <div className="h-screen w-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8 text-2xl font-semibold">
          <span className="text-vibe-blue">PuaForge</span>
          <span className="text-forge-terracotta">AI</span>
        </div>

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
                  onClick={() => navigate('/verify-email', { replace: true })}
                  className="w-full py-2 rounded-lg bg-forge-terracotta text-white text-sm font-medium hover:bg-forge-terracotta/90 transition cursor-pointer"
                >
                  {t('emailConfirmed.requestNew')}
                </button>
              )}
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="text-xs text-text-muted hover:text-text-primary transition cursor-pointer"
              >
                {t('emailConfirmed.backToLogin')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { Loader2, Mail, Lock, User } from 'lucide-react'
import * as yup from 'yup'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/api'

type Tab = 'login' | 'register'
type FieldErrors = Record<string, string>

export default function Login() {
  const { login, register, loginWithGoogle } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('login')

  const ERROR_MESSAGES: Record<string, string> = {
    ERROR_EMAIL_ALREADY_USED: t('login.errors.emailInUse'),
    ERROR_INVALID_CREDENTIALS: t('login.errors.invalidCredentials'),
    ERROR_MISSING_FIELDS: t('login.errors.missingFields'),
    ERROR_INVALID_GOOGLE_TOKEN: t('login.errors.googleFailed'),
    ERROR_USER_NOT_FOUND: t('login.errors.userNotFound'),
    ERROR_EMAIL_NOT_VERIFIED: t('login.errors.emailNotVerified'),
  }

  const goToVerify = (userEmail: string) => {
    sessionStorage.setItem('verify_email', userEmail)
    navigate('/verify-email')
  }

  const loginSchema = yup.object({
    email: yup.string().email(t('login.errors.invalidEmail')).required(t('login.errors.emailRequired')),
    password: yup.string().required(t('login.errors.passwordRequired')),
  })

  const registerSchema = yup.object({
    name: yup.string().required(t('login.errors.nameRequired')),
    email: yup.string().email(t('login.errors.invalidEmail')).required(t('login.errors.emailRequired')),
    password: yup.string().min(6, t('login.errors.minChars')).required(t('login.errors.passwordRequired')),
  })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const switchTab = (t: Tab) => {
    setTab(t)
    setError('')
    setFieldErrors({})
  }

  const validate = async (): Promise<boolean> => {
    try {
      const schema = tab === 'login' ? loginSchema : registerSchema
      await schema.validate({ name, email, password }, { abortEarly: false })
      setFieldErrors({})
      return true
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors: FieldErrors = {}
        err.inner.forEach((e) => {
          if (e.path) errors[e.path] = e.message
        })
        setFieldErrors(errors)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!(await validate())) return
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(email, password)
      } else {
        await register(email, password, name)
        goToVerify(email)
      }
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'UNKNOWN'
      if (code === 'ERROR_EMAIL_NOT_VERIFIED') {
        goToVerify(email)
        return
      }
      setError(ERROR_MESSAGES[code] ?? t('login.errors.genericError'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async (credential: string) => {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle(credential)
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'UNKNOWN'
      setError(ERROR_MESSAGES[code] ?? t('login.errors.googleGenericError'))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field: string) =>
    `w-full bg-bg-primary border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition ${
      fieldErrors[field]
        ? 'border-red-500 focus:border-red-500'
        : 'border-border-subtle focus:border-forge-terracotta'
    }`

  return (
    <div className="h-screen w-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8 text-2xl font-semibold">
          <span className="text-vibe-blue">PuaForge</span>
          <span className="text-forge-terracotta">AI</span>
        </div>

        <div className="bg-bg-secondary border border-border-subtle rounded-2xl p-6">
          <div className="flex rounded-lg bg-bg-primary p-1 mb-6">
            {(['login', 'register'] as Tab[]).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => switchTab(tabKey)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
                  tab === tabKey
                    ? 'bg-forge-terracotta text-white'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {tabKey === 'login' ? t('login.loginTab') : t('login.registerTab')}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {tab === 'register' && (
              <div>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder={t('login.namePlaceholder')}
                    value={name}
                    onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: '' })) }}
                    className={inputClass('name')}
                  />
                </div>
                {fieldErrors.name && <p className="text-xs text-red-400 mt-1 ml-1">{fieldErrors.name}</p>}
              </div>
            )}

            <div>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })) }}
                  className={inputClass('email')}
                />
              </div>
              {fieldErrors.email && <p className="text-xs text-red-400 mt-1 ml-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="password"
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })) }}
                  className={inputClass('password')}
                />
              </div>
              {fieldErrors.password && <p className="text-xs text-red-400 mt-1 ml-1">{fieldErrors.password}</p>}
            </div>

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg bg-forge-terracotta text-white text-sm font-medium hover:bg-forge-terracotta/90 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-1"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {tab === 'login' ? t('login.loginTab') : t('login.registerButton')}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-bg-secondary px-3 text-xs text-text-muted">{t('common.or')}</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(res) => {
                if (res.credential) handleGoogle(res.credential)
              }}
              onError={() => setError(t('login.errors.googleGenericError'))}
              theme="filled_black"
              shape="rectangular"
              text={tab === 'login' ? 'signin_with' : 'signup_with'}
              size="large"
              width="100%"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

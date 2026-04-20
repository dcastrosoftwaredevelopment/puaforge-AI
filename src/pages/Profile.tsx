import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import * as yup from 'yup'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { api, ApiError } from '@/services/api'
import Sidebar, { SidebarMenuButton } from '@/components/home/Sidebar'

export default function Profile() {
  const { user, token } = useAuth()
  const authHeaders = { Authorization: `Bearer ${token}` }
  const { t } = useTranslation()

  const ERROR_MESSAGES: Record<string, string> = {
    ERROR_INVALID_CURRENT_PASSWORD: t('profile.errors.wrongPassword'),
    ERROR_MISSING_CURRENT_PASSWORD: t('profile.errors.missingCurrentPassword'),
    ERROR_NO_PASSWORD_SET: t('profile.errors.googleAccount'),
  }

  const profileSchema = yup.object({
    name: yup.string().required(t('profile.errors.nameRequired')),
  })

  const passwordSchema = yup.object({
    currentPassword: yup.string().required(t('profile.errors.currentPasswordRequired')),
    newPassword: yup.string().min(6, t('profile.errors.minChars')).required(t('profile.errors.newPasswordRequired')),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('newPassword')], t('profile.errors.passwordMismatch'))
      .required(t('profile.errors.confirmPasswordRequired')),
  })

  const [name, setName] = useState(user?.name ?? '')
  const [nameError, setNameError] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError('')
    setNameSuccess(false)
    try {
      await profileSchema.validate({ name })
      setNameSaving(true)
      await api.patch('/api/profile', { name }, authHeaders)
      setNameSuccess(true)
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        setNameError(err.message)
      } else {
        const code = err instanceof ApiError ? err.code : 'UNKNOWN'
        setNameError(ERROR_MESSAGES[code] ?? 'Erro ao salvar. Tente novamente.')
      }
    } finally {
      setNameSaving(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordErrors({})
    setPasswordError('')
    setPasswordSuccess(false)
    try {
      await passwordSchema.validate({ currentPassword, newPassword, confirmPassword }, { abortEarly: false })
      setPasswordSaving(true)
      await api.patch('/api/profile', { currentPassword, newPassword }, authHeaders)
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors: Record<string, string> = {}
        err.inner.forEach((e) => { if (e.path) errors[e.path] = e.message })
        setPasswordErrors(errors)
      } else {
        const code = err instanceof ApiError ? err.code : 'UNKNOWN'
        setPasswordError(ERROR_MESSAGES[code] ?? 'Erro ao alterar senha. Tente novamente.')
      }
    } finally {
      setPasswordSaving(false)
    }
  }

  const inputClass = (error?: string) =>
    `w-full bg-bg-primary border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition ${
      error ? 'border-red-500' : 'border-border-subtle focus:border-forge-terracotta'
    }`

  return (
    <div className="h-screen flex bg-bg-primary">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle md:hidden">
          <SidebarMenuButton />
          <img src="/Logo PuaForge.png" alt="PuaForge AI" style={{ height: '20px', width: 'auto' }} />
        </div>
        <div className="max-w-lg mx-auto px-4 md:px-8 py-6 md:py-10">
          <h1 className="text-2xl font-semibold text-text-primary mb-8">{t('profile.title')}</h1>

          {/* Info */}
          <div className="bg-bg-secondary border border-border-subtle rounded-xl p-5 mb-6">
            <p className="text-xs text-text-muted mb-1">{t('profile.emailLabel')}</p>
            <p className="text-sm text-text-primary">{user?.email}</p>
            <p className="text-xs text-text-muted mt-2">{t('profile.emailNote')}</p>
          </div>

          {/* Name */}
          <div className="bg-bg-secondary border border-border-subtle rounded-xl p-5 mb-6">
            <h2 className="text-sm font-medium text-text-primary mb-4">{t('profile.nameSection')}</h2>
            <form onSubmit={handleSaveName} className="flex flex-col gap-3">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(''); setNameSuccess(false) }}
                  className={inputClass(nameError)}
                  placeholder={t('profile.namePlaceholder')}
                />
                {nameError && <p className="text-xs text-red-400 mt-1">{nameError}</p>}
                {nameSuccess && <p className="text-xs text-vibe-blue mt-1">{t('profile.nameSuccess')}</p>}
              </div>
              <button
                type="submit"
                disabled={nameSaving}
                className="self-end flex items-center gap-2 px-4 py-2 bg-forge-terracotta text-white text-sm font-medium rounded-lg hover:bg-forge-terracotta/90 transition disabled:opacity-50 cursor-pointer"
              >
                {nameSaving && <Loader2 size={13} className="animate-spin" />}
                {t('common.save')}
              </button>
            </form>
          </div>

          {/* Password */}
          <div className="bg-bg-secondary border border-border-subtle rounded-xl p-5">
            <h2 className="text-sm font-medium text-text-primary mb-4">{t('profile.passwordSection')}</h2>
            <form onSubmit={handleSavePassword} className="flex flex-col gap-3">
              <div>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setPasswordErrors((p) => ({ ...p, currentPassword: '' })) }}
                  className={inputClass(passwordErrors.currentPassword)}
                  placeholder={t('profile.currentPassword')}
                />
                {passwordErrors.currentPassword && <p className="text-xs text-red-400 mt-1">{passwordErrors.currentPassword}</p>}
              </div>
              <div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordErrors((p) => ({ ...p, newPassword: '' })) }}
                  className={inputClass(passwordErrors.newPassword)}
                  placeholder={t('profile.newPassword')}
                />
                {passwordErrors.newPassword && <p className="text-xs text-red-400 mt-1">{passwordErrors.newPassword}</p>}
              </div>
              <div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordErrors((p) => ({ ...p, confirmPassword: '' })) }}
                  className={inputClass(passwordErrors.confirmPassword)}
                  placeholder={t('profile.confirmPassword')}
                />
                {passwordErrors.confirmPassword && <p className="text-xs text-red-400 mt-1">{passwordErrors.confirmPassword}</p>}
              </div>
              {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
              {passwordSuccess && <p className="text-xs text-vibe-blue">{t('profile.passwordSuccess')}</p>}
              <button
                type="submit"
                disabled={passwordSaving}
                className="self-end flex items-center gap-2 px-4 py-2 bg-forge-terracotta text-white text-sm font-medium rounded-lg hover:bg-forge-terracotta/90 transition disabled:opacity-50 cursor-pointer"
              >
                {passwordSaving && <Loader2 size={13} className="animate-spin" />}
                {t('profile.changePassword')}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

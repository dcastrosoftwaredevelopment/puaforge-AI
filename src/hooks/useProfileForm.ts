import { useState } from 'react'
import * as yup from 'yup'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { api, ApiError } from '@/services/api'

export function useProfileForm() {
  const { user, token } = useAuth()
  const { t } = useTranslation()
  const authHeaders = { Authorization: `Bearer ${token}` }

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

  return {
    name, setName, nameError, nameSaving, nameSuccess,
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    passwordErrors, setPasswordErrors,
    passwordSaving, passwordSuccess,
    passwordError,
    handleSaveName,
    handleSavePassword,
  }
}

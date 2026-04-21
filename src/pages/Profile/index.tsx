import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TextInput } from 'flowbite-react'
import { useProfileForm } from '@/hooks/useProfileForm'
import Sidebar, { SidebarMenuButton } from '@/components/home/Sidebar'
import Button from '@/components/ui/Button'

export default function Profile() {
  const { t } = useTranslation()
  const {
    name, setName, nameError, nameSaving, nameSuccess,
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    passwordErrors, setPasswordErrors,
    passwordSaving, passwordSuccess,
    passwordError,
    handleSaveName,
    handleSavePassword,
  } = useProfileForm()

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
            <p className="text-sm text-text-primary">{name}</p>
            <p className="text-xs text-text-muted mt-2">{t('profile.emailNote')}</p>
          </div>

          {/* Name */}
          <div className="bg-bg-secondary border border-border-subtle rounded-xl p-5 mb-6">
            <h2 className="text-sm font-medium text-text-primary mb-4">{t('profile.nameSection')}</h2>
            <form onSubmit={handleSaveName} className="flex flex-col gap-3">
              <div>
                <TextInput
                  type="text"
                  value={name}
                  color={nameError ? 'failure' : 'gray'}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('profile.namePlaceholder')}
                />
                {nameError && <p className="text-xs text-red-400 mt-1">{nameError}</p>}
                {nameSuccess && <p className="text-xs text-vibe-blue mt-1">{t('profile.nameSuccess')}</p>}
              </div>
              <Button type="submit" variant="primary" size="md" isLoading={nameSaving} className="self-end gap-2">
                {nameSaving && <Loader2 size={13} className="animate-spin" />}
                {t('common.save')}
              </Button>
            </form>
          </div>

          {/* Password */}
          <div className="bg-bg-secondary border border-border-subtle rounded-xl p-5">
            <h2 className="text-sm font-medium text-text-primary mb-4">{t('profile.passwordSection')}</h2>
            <form onSubmit={handleSavePassword} className="flex flex-col gap-3">
              <div>
                <TextInput
                  type="password"
                  value={currentPassword}
                  color={passwordErrors.currentPassword ? 'failure' : 'gray'}
                  onChange={(e) => { setCurrentPassword(e.target.value); setPasswordErrors((p) => ({ ...p, currentPassword: '' })) }}
                  placeholder={t('profile.currentPassword')}
                />
                {passwordErrors.currentPassword && <p className="text-xs text-red-400 mt-1">{passwordErrors.currentPassword}</p>}
              </div>
              <div>
                <TextInput
                  type="password"
                  value={newPassword}
                  color={passwordErrors.newPassword ? 'failure' : 'gray'}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordErrors((p) => ({ ...p, newPassword: '' })) }}
                  placeholder={t('profile.newPassword')}
                />
                {passwordErrors.newPassword && <p className="text-xs text-red-400 mt-1">{passwordErrors.newPassword}</p>}
              </div>
              <div>
                <TextInput
                  type="password"
                  value={confirmPassword}
                  color={passwordErrors.confirmPassword ? 'failure' : 'gray'}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordErrors((p) => ({ ...p, confirmPassword: '' })) }}
                  placeholder={t('profile.confirmPassword')}
                />
                {passwordErrors.confirmPassword && <p className="text-xs text-red-400 mt-1">{passwordErrors.confirmPassword}</p>}
              </div>
              {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
              {passwordSuccess && <p className="text-xs text-vibe-blue">{t('profile.passwordSuccess')}</p>}
              <Button type="submit" variant="primary" size="md" isLoading={passwordSaving} className="self-end gap-2">
                {passwordSaving && <Loader2 size={13} className="animate-spin" />}
                {t('profile.changePassword')}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

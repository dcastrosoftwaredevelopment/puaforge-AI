import { useTranslation } from 'react-i18next';
import { useProfileForm } from '@/hooks/useProfileForm';
import Sidebar, { SidebarMenuButton } from '@/components/sidebar/Sidebar';
import NameSection from './components/NameSection';
import PasswordSection from './components/PasswordSection';

export default function Profile() {
  const { t } = useTranslation();
  const {
    name,
    setName,
    nameError,
    nameSaving,
    nameSuccess,
    handleSaveName,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordErrors,
    setPasswordErrors,
    passwordSaving,
    passwordSuccess,
    passwordError,
    handleSavePassword,
  } = useProfileForm();

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

          <div className="bg-bg-secondary border border-border-subtle rounded-xl p-5 mb-6">
            <p className="text-xs text-text-muted mb-1">{t('profile.emailLabel')}</p>
            <p className="text-sm text-text-primary">{name}</p>
            <p className="text-xs text-text-muted mt-2">{t('profile.emailNote')}</p>
          </div>

          <NameSection
            name={name}
            setName={setName}
            nameError={nameError}
            nameSaving={nameSaving}
            nameSuccess={nameSuccess}
            handleSaveName={handleSaveName}
          />
          <PasswordSection
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            passwordErrors={passwordErrors}
            setPasswordErrors={setPasswordErrors}
            passwordSaving={passwordSaving}
            passwordSuccess={passwordSuccess}
            passwordError={passwordError}
            handleSavePassword={handleSavePassword}
          />
        </div>
      </main>
    </div>
  );
}

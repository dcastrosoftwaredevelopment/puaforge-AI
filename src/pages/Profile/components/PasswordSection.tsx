import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { TextInput } from 'flowbite-react';
import Button from '@/components/ui/Button';

interface Props {
  currentPassword: string
  setCurrentPassword: (v: string) => void
  newPassword: string
  setNewPassword: (v: string) => void
  confirmPassword: string
  setConfirmPassword: (v: string) => void
  passwordErrors: Record<string, string>
  setPasswordErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  passwordSaving: boolean
  passwordSuccess: boolean
  passwordError: string
  handleSavePassword: (e: React.FormEvent) => void
}

export default function PasswordSection({
  currentPassword, setCurrentPassword,
  newPassword, setNewPassword,
  confirmPassword, setConfirmPassword,
  passwordErrors, setPasswordErrors,
  passwordSaving, passwordSuccess, passwordError,
  handleSavePassword,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="bg-bg-secondary border border-border-subtle rounded-xl p-5">
      <h2 className="text-sm font-medium text-text-primary mb-4">{t('profile.passwordSection')}</h2>
      <form onSubmit={handleSavePassword} className="flex flex-col gap-3">
        <div>
          <TextInput
            type="password"
            value={currentPassword}
            color={passwordErrors.currentPassword ? 'failure' : 'gray'}
            onChange={(e) => { setCurrentPassword(e.target.value); setPasswordErrors((p) => ({ ...p, currentPassword: '' })); }}
            placeholder={t('profile.currentPassword')}
          />
          {passwordErrors.currentPassword && <p className="text-xs text-red-400 mt-1">{passwordErrors.currentPassword}</p>}
        </div>
        <div>
          <TextInput
            type="password"
            value={newPassword}
            color={passwordErrors.newPassword ? 'failure' : 'gray'}
            onChange={(e) => { setNewPassword(e.target.value); setPasswordErrors((p) => ({ ...p, newPassword: '' })); }}
            placeholder={t('profile.newPassword')}
          />
          {passwordErrors.newPassword && <p className="text-xs text-red-400 mt-1">{passwordErrors.newPassword}</p>}
        </div>
        <div>
          <TextInput
            type="password"
            value={confirmPassword}
            color={passwordErrors.confirmPassword ? 'failure' : 'gray'}
            onChange={(e) => { setConfirmPassword(e.target.value); setPasswordErrors((p) => ({ ...p, confirmPassword: '' })); }}
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
  );
}

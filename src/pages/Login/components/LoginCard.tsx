import { GoogleLogin } from '@react-oauth/google';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TextInput } from 'flowbite-react';
import Button from '@/components/ui/Button';

interface Props {
  tab: 'login' | 'register'
  switchTab: (tab: 'login' | 'register') => void
  name: string
  setName: (v: string) => void
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  loading: boolean
  error: string | null
  fieldErrors: Record<string, string>
  handleSubmit: (e: React.FormEvent) => void
  handleGoogle: (credential: string) => void
  clearFieldError: (field: string) => void
  setError: (msg: string) => void
}

export default function LoginCard({
  tab, switchTab,
  name, setName,
  email, setEmail,
  password, setPassword,
  loading, error, fieldErrors,
  handleSubmit, handleGoogle,
  clearFieldError, setError,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="bg-bg-secondary border border-border-subtle rounded-2xl p-6">
      <div className="flex rounded-lg bg-bg-primary p-1 mb-6">
        {(['login', 'register'] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => switchTab(tabKey)}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
              tab === tabKey ? 'bg-forge-terracotta text-white' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tabKey === 'login' ? t('login.loginTab') : t('login.registerTab')}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {tab === 'register' && (
          <div>
            <TextInput
              type="text"
              icon={User}
              placeholder={t('login.namePlaceholder')}
              value={name}
              color={fieldErrors.name ? 'failure' : 'gray'}
              onChange={(e) => { setName(e.target.value); clearFieldError('name'); }}
            />
            {fieldErrors.name && <p className="text-xs text-red-400 mt-1 ml-1">{fieldErrors.name}</p>}
          </div>
        )}
        <div>
          <TextInput
            type="email"
            icon={Mail}
            placeholder={t('login.emailPlaceholder')}
            value={email}
            color={fieldErrors.email ? 'failure' : 'gray'}
            onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
          />
          {fieldErrors.email && <p className="text-xs text-red-400 mt-1 ml-1">{fieldErrors.email}</p>}
        </div>
        <div>
          <TextInput
            type="password"
            icon={Lock}
            placeholder={t('login.passwordPlaceholder')}
            value={password}
            color={fieldErrors.password ? 'failure' : 'gray'}
            onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
          />
          {fieldErrors.password && <p className="text-xs text-red-400 mt-1 ml-1">{fieldErrors.password}</p>}
        </div>
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        <Button type="submit" variant="primary" size="md" isLoading={loading} fullWidth className="mt-1 gap-2">
          {loading && <Loader2 size={14} className="animate-spin" />}
          {tab === 'login' ? t('login.loginTab') : t('login.registerButton')}
        </Button>
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
          onSuccess={(res) => { if (res.credential) handleGoogle(res.credential); }}
          onError={() => setError(t('login.errors.googleGenericError'))}
          theme="filled_black"
          shape="rectangular"
          text={tab === 'login' ? 'signin_with' : 'signup_with'}
          size="large"
          width="100%"
        />
      </div>
    </div>
  );
}

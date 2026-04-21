import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/services/api';

type Tab = 'login' | 'register';
type FieldErrors = Record<string, string>;

export function useLoginForm() {
  const { login, register, loginWithGoogle } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const ERROR_MESSAGES: Record<string, string> = {
    ERROR_EMAIL_ALREADY_USED: t('login.errors.emailInUse'),
    ERROR_INVALID_CREDENTIALS: t('login.errors.invalidCredentials'),
    ERROR_MISSING_FIELDS: t('login.errors.missingFields'),
    ERROR_INVALID_GOOGLE_TOKEN: t('login.errors.googleFailed'),
    ERROR_USER_NOT_FOUND: t('login.errors.userNotFound'),
    ERROR_EMAIL_NOT_VERIFIED: t('login.errors.emailNotVerified'),
  };

  const loginSchema = yup.object({
    email: yup.string().email(t('login.errors.invalidEmail')).required(t('login.errors.emailRequired')),
    password: yup.string().required(t('login.errors.passwordRequired')),
  });

  const registerSchema = yup.object({
    name: yup.string().required(t('login.errors.nameRequired')),
    email: yup.string().email(t('login.errors.invalidEmail')).required(t('login.errors.emailRequired')),
    password: yup.string().min(6, t('login.errors.minChars')).required(t('login.errors.passwordRequired')),
  });

  const goToVerify = (userEmail: string) => {
    sessionStorage.setItem('verify_email', userEmail);
    navigate('/verify-email');
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setError('');
    setFieldErrors({});
  };

  const validate = async (): Promise<boolean> => {
    try {
      const schema = tab === 'login' ? loginSchema : registerSchema;
      await schema.validate({ name, email, password }, { abortEarly: false });
      setFieldErrors({});
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors: FieldErrors = {};
        err.inner.forEach((e) => {
          if (e.path) errors[e.path] = e.message;
        });
        setFieldErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!(await validate())) return;
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
        goToVerify(email);
      }
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'UNKNOWN';
      if (code === 'ERROR_EMAIL_NOT_VERIFIED') {
        goToVerify(email);
        return;
      }
      setError(ERROR_MESSAGES[code] ?? t('login.errors.genericError'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(credential);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'UNKNOWN';
      setError(ERROR_MESSAGES[code] ?? t('login.errors.googleGenericError'));
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (field: string) => setFieldErrors((prev) => ({ ...prev, [field]: '' }));

  return {
    tab,
    switchTab,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    fieldErrors,
    handleSubmit,
    handleGoogle,
    clearFieldError,
    setError,
  };
}

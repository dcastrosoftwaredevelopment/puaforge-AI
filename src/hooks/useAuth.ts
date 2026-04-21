import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { authTokenAtom, authUserAtom, authLoadingAtom } from '@/atoms/authAtoms';
import type { AuthUser } from '@/atoms/authAtoms';
import { apiKeyAtom, apiKeyEnabledAtom } from '@/atoms';
import { api } from '@/services/api';

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface NeedsVerificationResponse {
  status: 'needs_verification';
}

export function useAuth() {
  const [token, setToken] = useAtom(authTokenAtom);
  const [user, setUser] = useAtom(authUserAtom);
  const isLoading = useAtomValue(authLoadingAtom);
  const setApiKey = useSetAtom(apiKeyAtom);
  const setApiKeyEnabled = useSetAtom(apiKeyEnabledAtom);

  const saveSession = useCallback(
    ({ token, user }: AuthResponse) => {
      localStorage.setItem('auth_token', token);
      setToken(token);
      setUser(user);
      setApiKey(user.apiKey ?? '');
      setApiKeyEnabled(user.apiKeyEnabled);
    },
    [setToken, setUser, setApiKey, setApiKeyEnabled],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setApiKey('');
    setApiKeyEnabled(true);
  }, [setToken, setUser, setApiKey, setApiKeyEnabled]);

  const register = useCallback(
    (email: string, password: string, name: string) =>
      api.post<NeedsVerificationResponse>('/api/auth/register', { email, password, name }),
    [],
  );

  const login = useCallback(
    (email: string, password: string) =>
      api.post<AuthResponse>('/api/auth/login', { email, password }).then(saveSession),
    [saveSession],
  );

  const loginWithGoogle = useCallback(
    (credential: string) => api.post<AuthResponse>('/api/auth/google', { credential }).then(saveSession),
    [saveSession],
  );

  const verifyEmail = useCallback(
    (token: string) => api.get<AuthResponse>(`/api/auth/verify-email?token=${token}`).then(saveSession),
    [saveSession],
  );

  const resendVerification = useCallback(
    (email: string) => api.post<{ status: string }>('/api/auth/resend-verification', { email }),
    [],
  );

  return {
    token,
    user,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    loginWithGoogle,
    verifyEmail,
    resendVerification,
    logout,
  };
}

export function useAuthLoader() {
  const token = useAtomValue(authTokenAtom);
  const setUser = useSetAtom(authUserAtom);
  const setLoading = useSetAtom(authLoadingAtom);
  const setApiKey = useSetAtom(apiKeyAtom);
  const setApiKeyEnabled = useSetAtom(apiKeyEnabledAtom);

  const validate = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const user = await api.get<AuthUser>('/api/auth/me', { Authorization: `Bearer ${token}` });
      setUser(user);
      setApiKey(user.apiKey ?? '');
      setApiKeyEnabled(user.apiKeyEnabled);
    } catch {
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  }, [token, setUser, setLoading, setApiKey, setApiKeyEnabled]);

  return { validate };
}

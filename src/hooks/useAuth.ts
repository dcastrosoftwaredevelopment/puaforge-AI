import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { authTokenAtom, authUserAtom, authLoadingAtom } from '@/atoms/authAtoms'
import type { AuthUser } from '@/atoms/authAtoms'
import { api } from '@/services/api'

interface AuthResponse {
  token: string
  user: AuthUser
}

export function useAuth() {
  const [token, setToken] = useAtom(authTokenAtom)
  const [user, setUser] = useAtom(authUserAtom)
  const isLoading = useAtomValue(authLoadingAtom)

  const saveSession = useCallback(
    ({ token, user }: AuthResponse) => {
      localStorage.setItem('auth_token', token)
      setToken(token)
      setUser(user)
    },
    [setToken, setUser],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
  }, [setToken, setUser])

  const register = useCallback(
    (email: string, password: string, name: string) =>
      api
        .post<AuthResponse>('/api/auth/register', { email, password, name })
        .then(saveSession),
    [saveSession],
  )

  const login = useCallback(
    (email: string, password: string) =>
      api.post<AuthResponse>('/api/auth/login', { email, password }).then(saveSession),
    [saveSession],
  )

  const loginWithGoogle = useCallback(
    (credential: string) =>
      api.post<AuthResponse>('/api/auth/google', { credential }).then(saveSession),
    [saveSession],
  )

  return {
    token,
    user,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    loginWithGoogle,
    logout,
  }
}

export function useAuthLoader() {
  const token = useAtomValue(authTokenAtom)
  const setUser = useSetAtom(authUserAtom)
  const setLoading = useSetAtom(authLoadingAtom)

  const validate = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const user = await api.get<AuthUser>('/api/auth/me', { Authorization: `Bearer ${token}` })
      setUser(user)
    } catch {
      localStorage.removeItem('auth_token')
    } finally {
      setLoading(false)
    }
  }, [token, setUser, setLoading])

  return { validate }
}

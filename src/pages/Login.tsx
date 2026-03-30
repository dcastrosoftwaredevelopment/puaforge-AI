import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { Loader2, Mail, Lock, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

type Tab = 'login' | 'register'

export default function Login() {
  const { login, register, loginWithGoogle } = useAuth()
  const [tab, setTab] = useState<Tab>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(email, password)
      } else {
        await register(email, password, name)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar')
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
      setError(err instanceof Error ? err.message : 'Erro ao autenticar com Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8 text-2xl font-semibold">
          <span className="text-vibe-blue">PuaForge</span>
          <span className="text-forge-terracotta">AI</span>
        </div>

        <div className="bg-bg-secondary border border-border-subtle rounded-2xl p-6">
          <div className="flex rounded-lg bg-bg-primary p-1 mb-6">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
                  tab === t
                    ? 'bg-forge-terracotta text-white'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {t === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {tab === 'register' && (
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-bg-primary border border-border-subtle rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-forge-terracotta transition"
                />
              </div>
            )}

            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-bg-primary border border-border-subtle rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-forge-terracotta transition"
              />
            </div>

            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-bg-primary border border-border-subtle rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-forge-terracotta transition"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg bg-forge-terracotta text-white text-sm font-medium hover:bg-forge-terracotta/90 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-1"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {tab === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-bg-secondary px-3 text-xs text-text-muted">ou</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(res) => {
                if (res.credential) handleGoogle(res.credential)
              }}
              onError={() => setError('Erro ao autenticar com Google')}
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

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/api'
import ConfirmationCard from './components/ConfirmationCard'

type State = 'verifying' | 'success' | 'error'

export default function EmailConfirmed() {
  const { verifyEmail } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [state, setState] = useState<State>(() => token ? 'verifying' : 'error')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current || !token) return
    ran.current = true

    verifyEmail(token)
      .then(() => {
        setState('success')
        setTimeout(() => navigate('/', { replace: true }), 1500)
      })
      .catch((err) => {
        const code = err instanceof ApiError ? err.code : ''
        if (code !== 'ERROR_ALREADY_VERIFIED') {
          setState('error')
          return
        }
        navigate('/login', { replace: true })
      })
  }, [token, verifyEmail, navigate])

  const email = sessionStorage.getItem('verify_email') ?? ''

  return (
    <div className="h-screen w-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8 text-2xl font-semibold">
          <span className="text-vibe-blue">PuaForge</span>
          <span className="text-forge-terracotta">AI</span>
        </div>
        <ConfirmationCard
          state={state}
          email={email}
          onRequestNew={() => navigate('/verify-email', { replace: true })}
          onBackToLogin={() => navigate('/login', { replace: true })}
        />
      </div>
    </div>
  )
}

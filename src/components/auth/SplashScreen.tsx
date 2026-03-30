import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth, useAuthLoader } from '@/hooks/useAuth'

export default function SplashScreen() {
  const { validate } = useAuthLoader()
  const { isLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    validate()
  }, [validate])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate('/login', { replace: true })
    } else if (isAuthenticated && location.pathname === '/login') {
      navigate('/', { replace: true })
    }
  }, [isLoading, isAuthenticated, location.pathname, navigate])

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-bg-primary flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <span className="text-vibe-blue">PuaForge</span>
          <span className="text-forge-terracotta">AI</span>
        </div>
        <Loader2 size={20} className="animate-spin text-text-muted" />
      </div>
    )
  }

  return null
}

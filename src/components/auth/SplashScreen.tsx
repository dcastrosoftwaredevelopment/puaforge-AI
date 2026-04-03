import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth, useAuthLoader } from '@/hooks/useAuth'

const PUBLIC_PATHS = ['/login', '/verify-email', '/email-confirmed']

export default function SplashScreen() {
  const { validate } = useAuthLoader()
  const { isLoading, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    validate()
  }, [validate])

  useEffect(() => {
    if (isLoading) return

    const isPublic = PUBLIC_PATHS.some((p) => location.pathname.startsWith(p))

    if (!isAuthenticated && !isPublic) {
      navigate('/login', { replace: true })
      return
    }

    if (isAuthenticated) {
      if (!user?.emailVerified && !isPublic) {
        navigate('/verify-email', { replace: true })
        return
      }
      if (location.pathname === '/login') {
        navigate('/', { replace: true })
      }
    }
  }, [isLoading, isAuthenticated, user, location.pathname, navigate])

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

import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { usePersistence } from '@/hooks/usePersistence'
import { trackPageView } from '@/lib/analytics'
import ProjectList from '@/components/home/ProjectList'
import EditorView from '@/components/layout/EditorView'
import Settings from '@/components/settings/Settings'
import Login from '@/pages/Login'
import VerifyEmail from '@/pages/VerifyEmail'
import EmailConfirmed from '@/pages/EmailConfirmed'
import Profile from '@/pages/Profile'
import Billing from '@/pages/Billing'
import Help from '@/pages/Help'
import SplashScreen from '@/components/auth/SplashScreen'
import UpgradeModal from '@/components/billing/UpgradeModal'

export default function App() {
  const { isHydrated } = usePersistence()
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])

  return (
    <>
      <SplashScreen />
      <UpgradeModal />
      {isHydrated && (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/email-confirmed" element={<EmailConfirmed />} />
          <Route path="/" element={<ProjectList />} />
          <Route path="/project/:projectId" element={<EditorView />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      )}
    </>
  )
}

import { Routes, Route } from 'react-router-dom'
import { usePersistence } from '@/hooks/usePersistence'
import ProjectList from '@/components/home/ProjectList'
import EditorView from '@/components/layout/EditorView'
import Settings from '@/components/settings/Settings'
import Login from '@/pages/Login'
import SplashScreen from '@/components/auth/SplashScreen'

export default function App() {
  const { isHydrated } = usePersistence()

  return (
    <>
      <SplashScreen />
      {isHydrated && (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProjectList />} />
          <Route path="/project/:projectId" element={<EditorView />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      )}
    </>
  )
}

import { Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { usePersistence } from '@/hooks/usePersistence'
import ProjectList from '@/components/home/ProjectList'
import EditorView from '@/components/layout/EditorView'
import Settings from '@/components/settings/Settings'

export default function App() {
  const { isHydrated } = usePersistence()

  if (!isHydrated) {
    return (
      <div className="h-screen w-screen bg-bg-primary flex flex-col items-center justify-center gap-3">
        <Loader2 size={24} className="animate-spin text-text-muted" />
        <span className="text-text-muted text-sm">Carregando...</span>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<ProjectList />} />
      <Route path="/project/:projectId" element={<EditorView />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
}

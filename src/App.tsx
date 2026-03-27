import { useAtomValue } from 'jotai'
import { Loader2 } from 'lucide-react'
import { appViewAtom } from '@/atoms'
import { usePersistence } from '@/hooks/usePersistence'
import ProjectList from '@/components/home/ProjectList'
import EditorView from '@/components/layout/EditorView'

export default function App() {
  const { isHydrated } = usePersistence()
  const appView = useAtomValue(appViewAtom)

  if (!isHydrated) {
    return (
      <div className="h-screen w-screen bg-bg-primary flex flex-col items-center justify-center gap-3">
        <Loader2 size={24} className="animate-spin text-text-muted" />
        <span className="text-text-muted text-sm">Carregando...</span>
      </div>
    )
  }

  return appView === 'home' ? <ProjectList /> : <EditorView />
}

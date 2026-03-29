import { useLocation, useNavigate } from 'react-router-dom'
import { Layers, Settings } from 'lucide-react'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const isSettings = location.pathname === '/settings'

  return (
    <aside className="w-56 shrink-0 border-r border-border-subtle bg-bg-secondary flex flex-col">
      <div className="px-4 py-4 border-b border-border-subtle">
        <span className="flex items-center gap-1.5">
          <span className="font-sans font-bold text-vibe-blue">PuaForge</span>
          <span className="text-[9px] font-bold text-forge-terracotta leading-none">AI</span>
        </span>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1">
        <button
          onClick={() => navigate('/')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition ${
            !isSettings
              ? 'bg-bg-elevated text-text-primary'
              : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
          }`}
        >
          <Layers size={15} className="text-forge-terracotta/70" />
          Projetos
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition ${
            isSettings
              ? 'bg-bg-elevated text-text-primary'
              : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
          }`}
        >
          <Settings size={15} className="text-forge-terracotta/70" />
          Configurações
        </button>
      </nav>
    </aside>
  )
}

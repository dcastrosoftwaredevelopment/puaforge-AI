import { useLocation, useNavigate } from 'react-router-dom'
import { Layers, Settings } from 'lucide-react'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const isSettings = location.pathname === '/settings'

  return (
    <aside className="w-56 shrink-0 border-r border-border-subtle bg-bg-secondary flex flex-col">
      <div className="px-4 py-4 border-b border-border-subtle">
        <span className="flex items-center gap-0.5">
          <span className="font-sans font-extrabold text-pua-text">Pua</span>
          <span className="font-mono font-light text-vibe-blue">Forge</span>
          <span className="text-[9px] bg-forge-terracotta text-white px-1.5 py-0.5 rounded-sm ml-1 self-center leading-none">AI</span>
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

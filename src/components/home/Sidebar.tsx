import { useLocation, useNavigate } from 'react-router-dom'
import { Layers, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

function UserAvatar({ name }: { name?: string | null }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  return (
    <span className="w-5 h-5 rounded-full bg-forge-terracotta/20 text-forge-terracotta text-[10px] font-semibold flex items-center justify-center shrink-0">
      {initials}
    </span>
  )
}

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const isSettings = location.pathname === '/settings'
  const isProfile = location.pathname === '/profile'

  return (
    <aside className="w-56 shrink-0 border-r border-border-subtle bg-bg-secondary flex flex-col">
      <div className="px-4 py-4 border-b border-border-subtle">
        <img src="/Logo PuaForge.png" alt="PuaForge AI" style={{ width: '200px', height: 'auto' }} />
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
      </nav>

      <div className="px-2 py-3 border-t border-border-subtle space-y-1">
        <button
          onClick={() => navigate('/profile')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition ${
            isProfile
              ? 'bg-bg-elevated text-text-primary'
              : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
          }`}
        >
          <UserAvatar name={user?.name} />
          Perfil
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
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition text-text-secondary hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  )
}

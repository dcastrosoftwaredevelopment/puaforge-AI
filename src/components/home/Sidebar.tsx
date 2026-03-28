import { Layers } from 'lucide-react'

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-border-subtle bg-bg-secondary flex flex-col">
      <div className="px-4 py-4 border-b border-border-subtle">
        <span className="text-sm font-semibold text-text-primary tracking-tight">
          Vibe<span className="text-accent">.</span>Platform
        </span>
      </div>

      <nav className="flex-1 px-2 py-3">
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg-elevated text-text-primary text-sm font-medium cursor-pointer">
          <Layers size={15} className="text-text-secondary" />
          Projetos
        </button>
      </nav>
    </aside>
  )
}

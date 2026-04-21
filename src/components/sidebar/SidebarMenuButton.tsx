import { Menu } from 'lucide-react'
import { useSidebar } from '@/hooks/useSidebar'

export default function SidebarMenuButton() {
  const { open } = useSidebar()
  return (
    <button
      onClick={open}
      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer md:hidden"
    >
      <Menu size={18} />
    </button>
  )
}

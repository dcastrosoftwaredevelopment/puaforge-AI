import { useAtom } from 'jotai'
import { sidebarOpenAtom } from '@/atoms'

export function useSidebar() {
  const [isOpen, setIsOpen] = useAtom(sidebarOpenAtom)
  return { isOpen, setIsOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }
}

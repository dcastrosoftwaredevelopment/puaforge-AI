import React, { useEffect, type ComponentProps } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Layers, Settings, LogOut, CreditCard, HelpCircle, X, Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sidebar as FlowbiteSidebar, SidebarItem, SidebarItems, SidebarItemGroup, Drawer, Progress } from 'flowbite-react'
import Button from '@/components/ui/Button'
import { useSidebar } from '@/hooks/useSidebar'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { useUsage, formatBytes, formatLimit } from '@/hooks/useUsage'

function UsageBar({ used, limit, unit }: { used: number; limit: number; unit?: string }) {
  const isUnlimited = limit === Infinity || limit >= 1e9
  const pct = isUnlimited ? 0 : Math.min(100, (used / limit) * 100)
  const isWarning = pct >= 80
  const usedLabel = unit === 'bytes' ? formatBytes(used) : String(used)
  const limitLabel = formatLimit(limit, unit)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className={isWarning ? 'text-yellow-400' : 'text-text-muted'}>{usedLabel}</span>
        <span className="text-text-muted">{limitLabel}</span>
      </div>
      {!isUnlimited && (
        <Progress progress={pct} size="xs" color={isWarning ? 'yellow' : 'primary'} />
      )}
    </div>
  )
}

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

/** Hamburger button — show on mobile to open the sidebar drawer */
export function SidebarMenuButton() {
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

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { t } = useTranslation()
  const { toggle } = useLanguage()
  const { data: usage } = useUsage()
  const { isOpen, setIsOpen } = useSidebar()

  const isSettings = location.pathname === '/settings'
  const isProfile = location.pathname === '/profile'
  const isBilling = location.pathname === '/billing'
  const isHelp = location.pathname === '/help'
  const isHome = !isSettings && !isProfile && !isBilling && !isHelp

  useEffect(() => { setIsOpen(false) }, [location.pathname, setIsOpen])

  const planLabel = usage?.plan === 'indie' ? t('billing.plans.indie') : usage?.plan === 'pro' ? t('billing.plans.pro') : t('billing.plans.free')

  // Renders UserAvatar in place of the standard SVG icon slot
  const ProfileIcon: React.FC<ComponentProps<'svg'>> = () => <UserAvatar name={user?.name} />

  const sidebarContent = (
    <FlowbiteSidebar className="bg-bg-primary">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border-subtle flex items-center justify-between shrink-0">
        <img src="/Logo PuaForge.png" alt="PuaForge AI" style={{ width: '130px', height: 'auto' }} />
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer md:hidden"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main nav */}
      <SidebarItems className="flex-1">
        <SidebarItemGroup>
          <SidebarItem onClick={() => navigate('/')} icon={Layers} active={isHome}>
            {t('sidebar.projects')}
          </SidebarItem>
        </SidebarItemGroup>
      </SidebarItems>

      {/* Usage */}
      {usage && (
        <div className="px-3 py-3 border-t border-border-subtle space-y-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted uppercase tracking-wide">{t('sidebar.plan')}</span>
            <span className="text-[10px] font-semibold text-forge-terracotta">{planLabel}</span>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-[10px] text-text-muted">{t('sidebar.usageProjects')}</span>
              <UsageBar used={usage.usage.projects.used} limit={usage.usage.projects.limit} />
            </div>
            {usage.usage.storageBytes.limit > 0 && (
              <div>
                <span className="text-[10px] text-text-muted">{t('sidebar.usageStorage')}</span>
                <UsageBar used={usage.usage.storageBytes.used} limit={usage.usage.storageBytes.limit} unit="bytes" />
              </div>
            )}
          </div>
          {usage.plan === 'free' && (
            <Button variant="terracotta" size="xs" fullWidth onClick={() => navigate('/billing')}>
              {t('sidebar.upgrade')}
            </Button>
          )}
        </div>
      )}

      {/* Bottom nav */}
      <SidebarItems>
        <SidebarItemGroup>
          <SidebarItem
            onClick={() => navigate('/profile')}
            icon={ProfileIcon}
            active={isProfile}
          >
            {t('sidebar.profile')}
          </SidebarItem>
          <SidebarItem onClick={() => navigate('/billing')} icon={CreditCard} active={isBilling}>
            {t('sidebar.billing')}
          </SidebarItem>
          <SidebarItem onClick={() => navigate('/settings')} icon={Settings} active={isSettings}>
            {t('sidebar.settings')}
          </SidebarItem>
          <SidebarItem onClick={() => navigate('/help')} icon={HelpCircle} active={isHelp}>
            {t('sidebar.help')}
          </SidebarItem>
          <SidebarItem onClick={logout} icon={LogOut} className="hover:bg-red-500/10 hover:text-red-400">
            {t('sidebar.logout')}
          </SidebarItem>
        </SidebarItemGroup>
      </SidebarItems>

      {/* Language toggle — unique mono-label style, kept as raw button */}
      <div className="px-2 pb-3 shrink-0">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition text-text-muted hover:text-text-secondary hover:bg-bg-elevated"
        >
          <span className="text-[10px] font-mono border border-border-subtle rounded px-1.5 py-0.5">
            {t('sidebar.language')}
          </span>
        </button>
      </div>
    </FlowbiteSidebar>
  )

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-border-subtle bg-bg-primary">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <Drawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        position="left"
        className="md:hidden w-64 p-0 bg-bg-primary"
      >
        {sidebarContent}
      </Drawer>
    </>
  )
}

import { useLocation, useNavigate } from 'react-router-dom'
import { Layers, Settings, LogOut, CreditCard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
        <div className="h-0.5 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isWarning ? 'bg-yellow-400' : 'bg-forge-terracotta/50'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
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

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { t } = useTranslation()
  const { toggle } = useLanguage()
  const { data: usage } = useUsage()
  const isSettings = location.pathname === '/settings'
  const isProfile = location.pathname === '/profile'
  const isBilling = location.pathname === '/billing'

  const planLabel = usage?.plan === 'indie' ? 'Indie' : usage?.plan === 'pro' ? 'Pro' : t('billing.plans.free')

  return (
    <aside className="w-56 shrink-0 border-r border-border-subtle bg-bg-secondary flex flex-col">
      <div className="px-4 py-4 border-b border-border-subtle">
        <img src="/Logo PuaForge.png" alt="PuaForge AI" style={{ width: '130px', height: 'auto' }} />
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1">
        <button
          onClick={() => navigate('/')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition ${!isSettings
            ? 'bg-bg-elevated text-text-primary'
            : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
            }`}
        >
          <Layers size={15} className="text-forge-terracotta/70" />
          {t('sidebar.projects')}
        </button>
      </nav>

      {usage && (
        <div className="px-3 py-3 border-t border-border-subtle space-y-2.5">
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
            {usage.usage.importsThisMonth.limit > 0 && (
              <div>
                <span className="text-[10px] text-text-muted">{t('sidebar.usageImports')}</span>
                <UsageBar used={usage.usage.importsThisMonth.used} limit={usage.usage.importsThisMonth.limit} />
              </div>
            )}
          </div>
          {usage.plan === 'free' && (
            <button
              onClick={() => navigate('/billing')}
              className="w-full py-1.5 rounded-lg text-[10px] font-medium bg-forge-terracotta/10 text-forge-terracotta border border-forge-terracotta/20 hover:bg-forge-terracotta/20 transition cursor-pointer"
            >
              {t('sidebar.upgrade')}
            </button>
          )}
        </div>
      )}

      <div className="px-2 py-3 border-t border-border-subtle space-y-1">
        <button
          onClick={() => navigate('/profile')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition ${isProfile
            ? 'bg-bg-elevated text-text-primary'
            : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
            }`}
        >
          <UserAvatar name={user?.name} />
          {t('sidebar.profile')}
        </button>
        <button
          onClick={() => navigate('/billing')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition ${isBilling
            ? 'bg-bg-elevated text-text-primary'
            : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
            }`}
        >
          <CreditCard size={15} className="text-forge-terracotta/70" />
          {t('sidebar.billing')}
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition ${isSettings
            ? 'bg-bg-elevated text-text-primary'
            : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
            }`}
        >
          <Settings size={15} className="text-forge-terracotta/70" />
          {t('sidebar.settings')}
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition text-text-secondary hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={15} />
          {t('sidebar.logout')}
        </button>
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition text-text-muted hover:text-text-secondary hover:bg-bg-elevated"
        >
          <span className="text-[10px] font-mono border border-border-subtle rounded px-1.5 py-0.5">
            {t('sidebar.language')}
          </span>
        </button>
      </div>
    </aside>
  )
}

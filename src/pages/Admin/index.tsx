import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import type { UserStatus } from '@/hooks/useAdminUsers';
import Sidebar, { SidebarMenuButton } from '@/components/sidebar/Sidebar';
import AppLogo from '@/components/ui/AppLogo';
import Button from '@/components/ui/Button';

export default function AdminUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { users, total, totalPages, page, statusFilter, isLoading, updatingId, updateStatus, changeFilter, changePage } =
    useAdminUsers();

  if (user?.role !== 'superuser') {
    navigate('/');
    return null;
  }

  const filters: Array<{ key: UserStatus | 'all'; label: string }> = [
    { key: 'all', label: t('adminUsers.filterAll') },
    { key: 'pending', label: t('adminUsers.filterPending') },
    { key: 'active', label: t('adminUsers.filterActive') },
    { key: 'blocked', label: t('adminUsers.filterBlocked') },
  ];

  const statusBadge = (status: UserStatus) => {
    if (status === 'active')
      return <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/15 text-green-400">{t('adminUsers.statusActive')}</span>;
    if (status === 'pending')
      return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/15 text-yellow-400">{t('adminUsers.statusPending')}</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/15 text-red-400">{t('adminUsers.statusBlocked')}</span>;
  };

  return (
    <div className="h-screen flex bg-bg-primary">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle md:hidden">
          <SidebarMenuButton />
          <AppLogo compact />
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-text-primary">{t('adminUsers.title')}</h1>
              <p className="text-sm text-text-muted mt-1">{total} {t('adminUsers.filterAll').toLowerCase()}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => changeFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                  statusFilter === f.key
                    ? 'bg-forge-terracotta text-white'
                    : 'bg-bg-elevated text-text-muted hover:text-text-primary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border-subtle overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bg-elevated border-b border-border-subtle">
                <tr>
                  <th className="text-left px-4 py-3 text-text-muted font-medium">{t('adminUsers.name')}</th>
                  <th className="text-left px-4 py-3 text-text-muted font-medium hidden sm:table-cell">{t('adminUsers.email')}</th>
                  <th className="text-left px-4 py-3 text-text-muted font-medium">{t('adminUsers.status')}</th>
                  <th className="text-left px-4 py-3 text-text-muted font-medium hidden md:table-cell">{t('adminUsers.createdAt')}</th>
                  <th className="text-right px-4 py-3 text-text-muted font-medium">{t('adminUsers.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {isLoading ?
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-bg-elevated rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : users.length === 0 ?
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                      {t('adminUsers.noUsers')}
                    </td>
                  </tr>
                : users.map((u) => (
                    <tr key={u.id} className="hover:bg-bg-elevated/50 transition">
                      <td className="px-4 py-3 text-text-primary">
                        <div className="font-medium">{u.name ?? '—'}</div>
                        <div className="text-xs text-text-muted sm:hidden">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">{u.email}</td>
                      <td className="px-4 py-3">{statusBadge(u.status)}</td>
                      <td className="px-4 py-3 text-text-muted hidden md:table-cell">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {u.status !== 'active' && u.role !== 'superuser' && (
                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={() => updateStatus(u.id, 'active')}
                              disabled={updatingId === u.id}
                            >
                              {t('adminUsers.approve')}
                            </Button>
                          )}
                          {u.status === 'active' && u.role !== 'superuser' && (
                            <Button
                              variant="danger"
                              size="xs"
                              onClick={() => {
                                if (window.confirm(t('adminUsers.confirmBlock'))) updateStatus(u.id, 'blocked');
                              }}
                              disabled={updatingId === u.id}
                            >
                              {t('adminUsers.block')}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-text-muted">
                {t('adminUsers.filterAll')}: {total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changePage(page - 1)}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg hover:bg-bg-elevated disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  <ChevronLeft size={16} className="text-text-muted" />
                </button>
                <span className="text-sm text-text-secondary">{page} / {totalPages}</span>
                <button
                  onClick={() => changePage(page + 1)}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg hover:bg-bg-elevated disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  <ChevronRight size={16} className="text-text-muted" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

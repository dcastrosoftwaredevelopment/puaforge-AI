import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ChevronDown, ChevronRight, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';
import Sidebar, { SidebarMenuButton } from '@/components/sidebar/Sidebar';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import NewTeamModal from './components/NewTeamModal';
import MemberRow from './components/MemberRow';
import AddMemberForm from './components/AddMemberForm';

interface PendingConfirm {
  title: string;
  message: string;
  onConfirm: () => void;
}

export default function Team() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const {
    teams,
    used,
    limit,
    memberLimit,
    isLoading,
    expandedId,
    loadingMembers,
    addingMemberTo,
    deletingId,
    creatingTeam,
    error,
    toggleExpand,
    createTeam,
    deleteTeam,
    addMember,
    removeMember,
    leaveTeam,
    clearError,
  } = useTeam();

  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = (title: string, message: string, onConfirm: () => void) =>
    setPending({ title, message, onConfirm });

  const atLimit = limit !== null && used >= limit;
  const limitLabel =
    limit === null ? t('team.limitUnlimited') : t('team.limitBadge', { used, limit });

  return (
    <div className="h-screen flex bg-bg-primary">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle md:hidden">
          <SidebarMenuButton />
          <img src="/Logo PuaForge.png" alt="PuaForge AI" style={{ height: '20px', width: 'auto' }} />
        </div>

        <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-text-primary">{t('team.title')}</h1>
              <p className="text-sm text-text-muted mt-1">{limitLabel}</p>
            </div>
            <Button
              variant="terracotta"
              size="md"
              onClick={() => setShowNewTeamModal(true)}
              disabled={atLimit}
              className="gap-2"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">{t('team.newTeam')}</span>
            </Button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
              {t(error, { defaultValue: t('team.errors.generic') })}
              <button onClick={clearError} className="ml-2 underline text-xs cursor-pointer">
                {t('common.close')}
              </button>
            </div>
          )}

          {isLoading ?
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-bg-elevated rounded-xl animate-pulse" />
              ))}
            </div>
          : teams.length === 0 ?
            <p className="text-sm text-text-muted py-8 text-center">{t('team.noTeams')}</p>
          : <div className="space-y-3">
              {teams.map((team) => {
                const isOwner = team.ownerId === user?.id;
                const isExpanded = expandedId === team.id;

                return (
                  <div key={team.id} className="rounded-xl border border-border-subtle bg-bg-secondary overflow-hidden">
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-bg-elevated/50 transition"
                      onClick={() => toggleExpand(team.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ?
                          <ChevronDown size={16} className="text-text-muted flex-shrink-0" />
                        : <ChevronRight size={16} className="text-text-muted flex-shrink-0" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary">{team.name}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                isOwner ?
                                  'bg-forge-terracotta/15 text-forge-terracotta'
                                : 'bg-bg-elevated text-text-muted'
                              }`}
                            >
                              {isOwner ? t('team.ownerBadge') : t('team.memberBadge')}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted mt-0.5">
                            {t('team.members', { count: team.memberCount })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {isOwner ?
                          <button
                            onClick={() =>
                              confirm(t('team.deleteTeam'), t('team.confirmDelete'), () => deleteTeam(team.id))
                            }
                            disabled={deletingId === team.id}
                            className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-bg-primary transition disabled:opacity-40 cursor-pointer"
                            title={t('team.deleteTeam')}
                          >
                            <Trash2 size={14} />
                          </button>
                        : <button
                            onClick={() =>
                              user &&
                              confirm(t('team.leaveTeam'), t('team.confirmLeave'), () =>
                                leaveTeam(team.id, user.id),
                              )
                            }
                            className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-bg-primary transition cursor-pointer"
                            title={t('team.leaveTeam')}
                          >
                            <LogOut size={14} />
                          </button>
                        }
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border-subtle px-4 py-3 space-y-2">
                        {loadingMembers === team.id ?
                          <div className="space-y-2">
                            {Array.from({ length: 2 }).map((_, i) => (
                              <div key={i} className="h-8 bg-bg-elevated rounded animate-pulse" />
                            ))}
                          </div>
                        : team.members?.length === 0 ?
                          <p className="text-xs text-text-muted py-1">{t('team.noMembers')}</p>
                        : team.members?.map((member) => (
                            <MemberRow
                              key={member.userId}
                              member={member}
                              isOwner={isOwner}
                              currentUserId={user?.id ?? ''}
                              onRemove={() =>
                                confirm(t('team.removeMember'), t('team.confirmRemove'), () =>
                                  removeMember(team.id, member.userId),
                                )
                              }
                            />
                          ))
                        }

                        {isOwner && (
                          <AddMemberForm
                            teamId={team.id}
                            isAdding={addingMemberTo === team.id}
                            atLimit={memberLimit !== null && team.memberCount >= memberLimit}
                            memberLimit={memberLimit}
                            onAdd={(email) => addMember(team.id, email)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          }
        </div>
      </main>

      {showNewTeamModal && (
        <NewTeamModal
          isCreating={creatingTeam}
          onCreate={async (name) => {
            await createTeam(name);
            setShowNewTeamModal(false);
          }}
          onClose={() => setShowNewTeamModal(false)}
        />
      )}

      <ConfirmModal
        open={!!pending}
        title={pending?.title ?? ''}
        message={pending?.message ?? ''}
        confirmLabel={t('common.confirm')}
        onConfirm={() => {
          pending?.onConfirm();
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

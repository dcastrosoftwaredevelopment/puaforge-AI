import { useTranslation } from 'react-i18next';
import { Modal, ModalBody, ToggleSwitch } from 'flowbite-react';
import { useTeam } from '@/hooks/useTeam';
import { useProjectSharing } from '@/hooks/useProjectSharing';

interface ShareModalProps {
  projectId: string;
  onClose: () => void;
}

export default function ShareModal({ projectId, onClose }: ShareModalProps) {
  const { t } = useTranslation();
  const { teams, isLoading: teamsLoading } = useTeam();
  const { sharedTeams, isLoading: sharingLoading, shareWithTeam, unshareFromTeam } =
    useProjectSharing(projectId);

  const isShared = (teamId: string) => sharedTeams.some((t) => t.teamId === teamId);

  const toggle = async (teamId: string) => {
    if (isShared(teamId)) {
      await unshareFromTeam(teamId);
    } else {
      await shareWithTeam(teamId);
    }
  };

  const ownedTeams = teams;

  return (
    <Modal show dismissible onClose={onClose} size="sm">
      <ModalBody>
        <h2 className="text-base font-semibold text-text-primary mb-1">{t('projects.teamSharingTitle')}</h2>
        <p className="text-sm text-text-muted mb-4">{t('projects.teamSharingHint')}</p>

        {teamsLoading || sharingLoading ?
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 bg-bg-elevated rounded animate-pulse" />
            ))}
          </div>
        : ownedTeams.length === 0 ?
          <p className="text-sm text-text-muted py-2">{t('projects.noTeams')}</p>
        : <div className="space-y-3">
            {ownedTeams.map((team) => (
              <div key={team.id} className="flex items-center justify-between">
                <span className="text-sm text-text-primary">{team.name}</span>
                <ToggleSwitch
                  checked={isShared(team.id)}
                  onChange={() => toggle(team.id)}
                  label=""
                />
              </div>
            ))}
          </div>
        }
      </ModalBody>
    </Modal>
  );
}

import { UserMinus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TeamMember } from '@/hooks/useTeam';

interface MemberRowProps {
  member: TeamMember;
  isOwner: boolean;
  currentUserId: string;
  onRemove: () => void;
}

export default function MemberRow({ member, isOwner, currentUserId, onRemove }: MemberRowProps) {
  const { t } = useTranslation();
  const canRemove = isOwner && member.userId !== currentUserId;

  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <span className="text-sm text-text-primary">{member.name ?? member.email}</span>
        {member.name && <span className="text-xs text-text-muted ml-2">{member.email}</span>}
      </div>
      {canRemove && (
        <button
          onClick={onRemove}
          className="p-1 rounded text-text-muted hover:text-red-400 transition cursor-pointer"
          title={t('team.removeMember')}
        >
          <UserMinus size={14} />
        </button>
      )}
    </div>
  );
}

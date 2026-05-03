import { useState, useCallback, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { authTokenAtom } from '@/atoms/authAtoms';
import { api } from '@/services/api';

interface SharedTeam {
  teamId: string;
  name: string;
}

export function useProjectSharing(projectId: string) {
  const token = useAtomValue(authTokenAtom);
  const headers = { Authorization: `Bearer ${token}` };

  const [sharedTeams, setSharedTeams] = useState<SharedTeam[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProjectTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ teams: SharedTeam[] }>(`/api/projects/${projectId}/teams`, headers);
      setSharedTeams(data.teams);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, token]);

  const shareWithTeam = useCallback(
    async (teamId: string) => {
      await api.post(`/api/projects/${projectId}/teams`, { teamId }, headers);
      setSharedTeams((prev) => {
        if (prev.some((t) => t.teamId === teamId)) return prev;
        return [...prev, { teamId, name: '' }];
      });
    },
    [projectId, token],
  );

  const unshareFromTeam = useCallback(
    async (teamId: string) => {
      await api.delete(`/api/projects/${projectId}/teams/${teamId}`, headers);
      setSharedTeams((prev) => prev.filter((t) => t.teamId !== teamId));
    },
    [projectId, token],
  );

  useEffect(() => {
    if (token) fetchProjectTeams();
  }, [token, fetchProjectTeams]);

  return { sharedTeams, isLoading, fetchProjectTeams, shareWithTeam, unshareFromTeam };
}

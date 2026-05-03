import { useState, useCallback, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { authTokenAtom } from '@/atoms/authAtoms';
import { api } from '@/services/api';

export interface TeamMember {
  userId: string;
  email: string;
  name: string | null;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  memberCount: number;
  members?: TeamMember[];
}

interface TeamsResponse {
  teams: Team[];
  used: number;
  limit: number | null;
}

export function useTeam() {
  const token = useAtomValue(authTokenAtom);
  const headers = { Authorization: `Bearer ${token}` };

  const [teams, setTeams] = useState<Team[]>([]);
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingMembers, setLoadingMembers] = useState<string | null>(null);
  const [addingMemberTo, setAddingMemberTo] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<TeamsResponse>('/api/teams', headers);
      setTeams(data.teams);
      setUsed(data.used);
      setLimit(data.limit);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchMembers = useCallback(
    async (teamId: string) => {
      setLoadingMembers(teamId);
      try {
        const data = await api.get<{ members: TeamMember[] }>(`/api/teams/${teamId}/members`, headers);
        setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, members: data.members } : t)));
      } finally {
        setLoadingMembers(null);
      }
    },
    [token],
  );

  const toggleExpand = useCallback(
    (teamId: string) => {
      if (expandedId === teamId) {
        setExpandedId(null);
      } else {
        setExpandedId(teamId);
        const team = teams.find((t) => t.id === teamId);
        if (!team?.members) fetchMembers(teamId);
      }
    },
    [expandedId, teams, fetchMembers],
  );

  const createTeam = useCallback(
    async (name: string) => {
      setCreatingTeam(true);
      setError(null);
      try {
        const team = await api.post<Team>('/api/teams', { name }, headers);
        setTeams((prev) => [...prev, team]);
        setUsed((prev) => prev + 1);
        return team;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'team.errors.generic';
        setError(msg);
        throw err;
      } finally {
        setCreatingTeam(false);
      }
    },
    [token],
  );

  const deleteTeam = useCallback(
    async (teamId: string) => {
      setDeletingId(teamId);
      try {
        await api.delete(`/api/teams/${teamId}`, headers);
        setTeams((prev) => prev.filter((t) => t.id !== teamId));
        setUsed((prev) => prev - 1);
        if (expandedId === teamId) setExpandedId(null);
      } finally {
        setDeletingId(null);
      }
    },
    [token, expandedId],
  );

  const addMember = useCallback(
    async (teamId: string, email: string) => {
      setAddingMemberTo(teamId);
      setError(null);
      try {
        const member = await api.post<TeamMember>(`/api/teams/${teamId}/members`, { email }, headers);
        setTeams((prev) =>
          prev.map((t) =>
            t.id === teamId ?
              { ...t, memberCount: t.memberCount + 1, members: t.members ? [...t.members, member] : undefined }
            : t,
          ),
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'team.errors.generic';
        setError(msg);
        throw err;
      } finally {
        setAddingMemberTo(null);
      }
    },
    [token],
  );

  const removeMember = useCallback(
    async (teamId: string, userId: string) => {
      try {
        await api.delete(`/api/teams/${teamId}/members/${userId}`, headers);
        setTeams((prev) =>
          prev.map((t) =>
            t.id === teamId ?
              {
                ...t,
                memberCount: Math.max(0, t.memberCount - 1),
                members: t.members?.filter((m) => m.userId !== userId),
              }
            : t,
          ),
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'team.errors.generic';
        setError(msg);
        throw err;
      }
    },
    [token],
  );

  const leaveTeam = useCallback(
    async (teamId: string, userId: string) => {
      await removeMember(teamId, userId);
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
    },
    [removeMember],
  );

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (token) fetchTeams();
  }, [token]);

  return {
    teams,
    used,
    limit,
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
  };
}

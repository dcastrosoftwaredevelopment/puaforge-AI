import { useState, useCallback, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { authTokenAtom } from '@/atoms/authAtoms';
import { api } from '@/services/api';

export type UserStatus = 'pending' | 'active' | 'blocked';

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string | null;
}

interface UsersPage {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useAdminUsers() {
  const token = useAtomValue(authTokenAtom);
  const headers = { Authorization: `Bearer ${token}` };

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (p: number = page, filter: UserStatus | 'all' = statusFilter) => {
      setIsLoading(true);
      try {
        const query = filter !== 'all' ? `&status=${filter}` : '';
        const data = await api.get<UsersPage>(`/api/admin/users?page=${p}&limit=20${query}`, headers);
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(data.page);
      } finally {
        setIsLoading(false);
      }
    },
    [token, page, statusFilter],
  );

  const updateStatus = useCallback(
    async (id: string, status: 'active' | 'blocked') => {
      setUpdatingId(id);
      try {
        await api.patch(`/api/admin/users/${id}/status`, { status }, headers);
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
      } finally {
        setUpdatingId(null);
      }
    },
    [token],
  );

  const changeFilter = useCallback(
    (filter: UserStatus | 'all') => {
      setStatusFilter(filter);
      fetchUsers(1, filter);
    },
    [fetchUsers],
  );

  const changePage = useCallback(
    (p: number) => {
      fetchUsers(p, statusFilter);
    },
    [fetchUsers, statusFilter],
  );

  useEffect(() => {
    if (token) fetchUsers(1, 'all');
  }, [token]);

  return { users, total, totalPages, page, statusFilter, isLoading, updatingId, fetchUsers, updateStatus, changeFilter, changePage };
}

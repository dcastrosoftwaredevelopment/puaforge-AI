import { useCallback, useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { activeProjectIdAtom, checkpointsAtom, messagesAtom, type Checkpoint } from '@/atoms';
import { authTokenAtom } from '@/atoms/authAtoms';
import { useFiles } from '@/hooks/useFiles';
import { api } from '@/services/api';
import { extractDependencies } from '@/services/fileParser';
import { usePlanLimit } from '@/hooks/usePlanLimit';

export function useCheckpoints() {
  const [checkpoints, setCheckpoints] = useAtom(checkpointsAtom);
  const [, setMessages] = useAtom(messagesAtom);
  const activeProjectId = useAtomValue(activeProjectIdAtom);
  const token = useAtomValue(authTokenAtom);
  const { files, setFiles, setDeps } = useFiles();
  const withPlanLimit = usePlanLimit();

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  const createCheckpoint = useCallback(
    async (name: string) => {
      if (!activeProjectId || !authHeaders) return;
      const checkpoint: Checkpoint = {
        id: crypto.randomUUID(),
        name: name.trim() || `Checkpoint ${checkpoints.length + 1}`,
        files: { ...files },
        createdAt: Date.now(),
      };
      const result = await withPlanLimit(() =>
        api.post(`/api/projects/${activeProjectId}/checkpoints`, checkpoint, authHeaders),
      );
      if (!result) return;
      setCheckpoints((prev) => [checkpoint, ...prev]);
    },
    [activeProjectId, authHeaders, files, checkpoints.length, setCheckpoints, withPlanLimit],
  );

  const restoreCheckpoint = useCallback(
    async (id: string) => {
      const checkpoint = checkpoints.find((c) => c.id === id);
      if (!checkpoint) return;

      setFiles(checkpoint.files);
      const deps = extractDependencies(checkpoint.files);
      setDeps(Object.keys(deps).length > 0 ? deps : {});

      const fileList = Object.keys(checkpoint.files)
        .filter((p) => p !== '/index.html')
        .join(', ');

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: `[Código restaurado para o checkpoint "${checkpoint.name}"]\n\nArquivos atuais do projeto: ${fileList}\n\nIMPORTANTE: O código foi revertido para um estado anterior. Ignore as mensagens anteriores sobre arquivos que possam não existir mais. A partir de agora, considere APENAS os arquivos listados acima como o estado atual do projeto.`,
          timestamp: Date.now(),
        },
      ]);
    },
    [checkpoints, setFiles, setDeps, setMessages],
  );

  const deleteCheckpoint = useCallback(
    async (id: string) => {
      if (!activeProjectId || !authHeaders) return;
      await api.delete(`/api/projects/${activeProjectId}/checkpoints/${id}`, authHeaders);
      setCheckpoints((prev) => prev.filter((c) => c.id !== id));
    },
    [activeProjectId, authHeaders, setCheckpoints],
  );

  const renameCheckpoint = useCallback(
    async (id: string, name: string) => {
      if (!activeProjectId || !authHeaders) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      await api.patch(`/api/projects/${activeProjectId}/checkpoints/${id}`, { name: trimmed }, authHeaders);
      setCheckpoints((prev) => prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)));
    },
    [activeProjectId, authHeaders, setCheckpoints],
  );

  return { checkpoints, createCheckpoint, restoreCheckpoint, deleteCheckpoint, renameCheckpoint };
}

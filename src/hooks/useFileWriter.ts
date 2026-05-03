import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { filesAtom } from '@/atoms';

export function useFileWriter() {
  const setFiles = useSetAtom(filesAtom);

  return useCallback(
    (updates: Array<[string, string]>) => {
      setFiles((prev) => {
        const next = { ...prev };
        for (const [path, content] of updates) next[path] = content;
        return next;
      });
    },
    [setFiles],
  );
}

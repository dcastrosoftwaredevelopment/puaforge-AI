import { useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { blockRevAtom } from '@/atoms';

export function useBlockRevision() {
  return useAtomValue(blockRevAtom);
}

export function useIncrementBlockRev() {
  const set = useSetAtom(blockRevAtom);
  return useCallback(() => set((n) => n + 1), [set]);
}

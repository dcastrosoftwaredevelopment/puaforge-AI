import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { filesAtom, depsAtom } from '@/atoms';

export function useFiles() {
  const [files, setFiles] = useAtom(filesAtom);
  const deps = useAtomValue(depsAtom);
  const setDeps = useSetAtom(depsAtom);
  return { files, setFiles, deps, setDeps };
}

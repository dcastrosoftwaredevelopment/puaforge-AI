import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { filesAtom } from '@/atoms'

// External npm dependencies detected from AI-generated code
export const depsAtom = atom<Record<string, string>>({})

export function useFiles() {
  const [files, setFiles] = useAtom(filesAtom)
  const deps = useAtomValue(depsAtom)
  const setDeps = useSetAtom(depsAtom)
  return { files, setFiles, deps, setDeps }
}

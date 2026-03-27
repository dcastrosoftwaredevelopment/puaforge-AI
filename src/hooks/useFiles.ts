import { useAtom } from 'jotai'
import { filesAtom } from '@/atoms'

export function useFiles() {
  const [files, setFiles] = useAtom(filesAtom)
  return { files, setFiles }
}

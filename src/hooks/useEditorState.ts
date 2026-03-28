import { useAtom } from 'jotai'
import { editorDirtyAtom } from '@/atoms'

export function useEditorState() {
  const [isDirty, setDirty] = useAtom(editorDirtyAtom)
  return { isDirty, setDirty }
}

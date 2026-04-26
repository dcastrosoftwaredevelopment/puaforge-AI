import { useAtom, useAtomValue } from 'jotai';
import { editorDirtyAtom, editorActionsAtom } from '@/atoms';

export function useEditorState() {
  const [isDirty, setDirty] = useAtom(editorDirtyAtom);
  const { discard: discardEdits } = useAtomValue(editorActionsAtom);
  return { isDirty, setDirty, discardEdits };
}

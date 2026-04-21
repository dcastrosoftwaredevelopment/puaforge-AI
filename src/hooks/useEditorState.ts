import { useAtom, useAtomValue } from 'jotai';
import { editorDirtyAtom, editorActionsAtom } from '@/atoms';

export function useEditorState() {
  const [isDirty, setDirty] = useAtom(editorDirtyAtom);
  const { save: saveEdits, discard: discardEdits } = useAtomValue(editorActionsAtom);
  return { isDirty, setDirty, saveEdits, discardEdits };
}

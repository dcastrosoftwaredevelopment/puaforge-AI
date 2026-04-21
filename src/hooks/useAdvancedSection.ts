import { useAtomValue } from 'jotai';
import { selectedElementAtom, unknownClassesAtom } from '@/atoms';
import { useStyleEditor } from './useStyleEditor';

export function useAdvancedSection() {
  const selectedElement = useAtomValue(selectedElementAtom);
  const unknownClasses  = useAtomValue(unknownClassesAtom);
  const allClasses = selectedElement?.className.split(/\s+/).filter(Boolean) ?? [];
  const { removeOneClass, addOneClass } = useStyleEditor();
  return { allClasses, unknownClasses, removeOneClass, addOneClass };
}

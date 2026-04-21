import { useAtomValue } from 'jotai';
import { roundedAtom, borderWidthAtom, borderColorAtom, selectedElementAtom } from '@/atoms';
import { useStyleEditor } from './useStyleEditor';
import { ROUNDED_CLASSES, BORDER_WIDTHS } from '@/utils/tailwindClasses';

export function useBorderSection() {
  const rounded     = useAtomValue(roundedAtom);
  const borderWidth = useAtomValue(borderWidthAtom);
  const borderColor = useAtomValue(borderColorAtom);
  const elementId   = useAtomValue(selectedElementAtom)?.id;
  const { applyClass, removeCategory } = useStyleEditor();
  return {
    rounded, borderWidth, borderColor, elementId,
    applyClass,
    onRounded:     (v: string) => v ? applyClass(v) : removeCategory(ROUNDED_CLASSES[0]),
    onBorderWidth: (v: string) => v ? applyClass(v) : removeCategory(BORDER_WIDTHS[0]),
  };
}

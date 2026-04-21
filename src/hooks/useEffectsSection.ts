import { useAtomValue } from 'jotai';
import { shadowAtom, opacityAtom, overflowAtom } from '@/atoms';
import { useStyleEditor } from './useStyleEditor';
import { SHADOW_CLASSES, OVERFLOWS } from '@/utils/tailwindClasses';

export function useEffectsSection() {
  const shadow = useAtomValue(shadowAtom);
  const opacity = useAtomValue(opacityAtom);
  const overflow = useAtomValue(overflowAtom);
  const { applyClass, removeCategory } = useStyleEditor();
  return {
    shadow,
    opacity,
    overflow,
    applyClass,
    onShadow: (v: string) => (v ? applyClass(v) : removeCategory(SHADOW_CLASSES[0])),
    onOverflow: (v: string) => (v ? applyClass(v) : removeCategory(OVERFLOWS[0])),
  };
}

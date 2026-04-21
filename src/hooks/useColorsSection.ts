import { useAtomValue } from 'jotai';
import { bgColorAtom } from '@/atoms';
import { useStyleEditor } from './useStyleEditor';

export function useColorsSection() {
  const bgColor = useAtomValue(bgColorAtom);
  const { applyClass } = useStyleEditor();
  return { bgColor, applyClass };
}

import { useAtomValue } from 'jotai';
import { fontSizeAtom, fontWeightAtom, textAlignAtom, textColorAtom } from '@/atoms';
import { useStyleEditor } from './useStyleEditor';
import { FONT_SIZES, FONT_WEIGHTS } from '@/utils/tailwindClasses';

export function useTypographySection() {
  const fontSize = useAtomValue(fontSizeAtom);
  const fontWeight = useAtomValue(fontWeightAtom);
  const textAlign = useAtomValue(textAlignAtom);
  const textColor = useAtomValue(textColorAtom);
  const { applyClass, removeCategory } = useStyleEditor();
  return {
    fontSize,
    fontWeight,
    textAlign,
    textColor,
    applyClass,
    onFontSize: (v: string) => (v ? applyClass(v) : removeCategory(FONT_SIZES[0])),
    onFontWeight: (v: string) => (v ? applyClass(v) : removeCategory(FONT_WEIGHTS[0])),
  };
}

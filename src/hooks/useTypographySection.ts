import { useAtomValue } from 'jotai';
import { fontSizeAtom, fontWeightAtom, textAlignAtom, textColorAtom } from '@/atoms';
import { useStyleEditor } from './useStyleEditor';
import { useFontFamily } from './useFontFamily';
import { FONT_SIZES, FONT_WEIGHTS } from '@/utils/tailwindClasses';

export function useTypographySection() {
  const fontSize = useAtomValue(fontSizeAtom);
  const fontWeight = useAtomValue(fontWeightAtom);
  const textAlign = useAtomValue(textAlignAtom);
  const textColor = useAtomValue(textColorAtom);
  const { applyClass, removeCategory } = useStyleEditor();
  const { fontFamily, onFontFamily } = useFontFamily();
  return {
    fontSize,
    fontWeight,
    textAlign,
    textColor,
    fontFamily,
    applyClass,
    onFontFamily,
    onFontSize: (v: string) => (v ? applyClass(v) : removeCategory(FONT_SIZES[0])),
    onFontWeight: (v: string) => (v ? applyClass(v) : removeCategory(FONT_WEIGHTS[0])),
  };
}

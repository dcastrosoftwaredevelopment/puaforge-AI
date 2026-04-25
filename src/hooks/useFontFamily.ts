import { useAtomValue } from 'jotai';
import { fontFamilyAtom } from '@/atoms';
import { useStyleEditor } from './useStyleEditor';

export function useFontFamily() {
  const fontFamily = useAtomValue(fontFamilyAtom);
  const { addInlineProp, removeInlineProp } = useStyleEditor();

  const onFontFamily = (family: string) => {
    if (family) {
      addInlineProp('font-family', `'${family}', sans-serif`);
    } else {
      removeInlineProp('font-family');
    }
  };

  return { fontFamily, onFontFamily };
}

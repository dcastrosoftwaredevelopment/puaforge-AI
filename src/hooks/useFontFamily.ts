import { useAtom, useAtomValue } from 'jotai';
import { fontFamilyAtom, filesAtom } from '@/atoms';
import { useStyleEditor } from './useStyleEditor';
import { buildFontClassName, ensureFontClassInGlobalCss } from '@/utils/googleFonts';

export function useFontFamily() {
  const fontFamily = useAtomValue(fontFamilyAtom);
  const [files, setFiles] = useAtom(filesAtom);
  const { addOneClass, removeOneClass } = useStyleEditor();

  const onFontFamily = (family: string) => {
    // Remove current font class if any
    if (fontFamily) removeOneClass(buildFontClassName(fontFamily));

    if (family) {
      // Inject @import + CSS class rule into /__forge_global.css so Sandpack renders the font
      const currentGlobalCss = files['/__forge_global.css'] ?? '';
      const updatedGlobalCss = ensureFontClassInGlobalCss(currentGlobalCss, family);
      if (updatedGlobalCss !== currentGlobalCss) {
        setFiles((prev) => ({ ...prev, '/__forge_global.css': updatedGlobalCss }));
      }
      // Apply class to element — uses patchClassNameForElement which handles children
      // via block-range search, same as all other class-based style changes
      addOneClass(buildFontClassName(family));
    }
  };

  return { fontFamily, onFontFamily };
}

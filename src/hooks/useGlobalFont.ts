import { useAtom } from 'jotai';
import { filesAtom } from '@/atoms';
import { buildGlobalCss, parseGlobalFont } from '@/utils/googleFonts';

const GLOBAL_CSS_PATH = '/__forge_global.css';

export function useGlobalFont() {
  const [files, setFiles] = useAtom(filesAtom);
  const globalFont = parseGlobalFont(files[GLOBAL_CSS_PATH] ?? '');

  const setGlobalFont = (fontFamily: string) => {
    const css = buildGlobalCss(fontFamily);
    setFiles((prev) => ({ ...prev, [GLOBAL_CSS_PATH]: css }));
  };

  return { globalFont, setGlobalFont };
}

import { useAtomValue } from 'jotai';
import { displayAtom, flexDirAtom, justifyAtom, alignItemsAtom, gapAtom } from '@/atoms';
import { useStyleEditor } from './useStyleEditor';
import { DISPLAYS, FLEX_DIRS, JUSTIFY, ALIGN_ITEMS } from '@/utils/tailwindClasses';

export function useLayoutSection() {
  const display    = useAtomValue(displayAtom);
  const flexDir    = useAtomValue(flexDirAtom);
  const justify    = useAtomValue(justifyAtom);
  const alignItems = useAtomValue(alignItemsAtom);
  const gap        = useAtomValue(gapAtom);
  const { applyClass, removeCategory } = useStyleEditor();
  return {
    display, flexDir, justify, alignItems, gap,
    applyClass,
    onDisplay:    (v: string) => v ? applyClass(v) : removeCategory(DISPLAYS[0]),
    onFlexDir:    (v: string) => v ? applyClass(v) : removeCategory(FLEX_DIRS[0]),
    onJustify:    (v: string) => v ? applyClass(v) : removeCategory(JUSTIFY[0]),
    onAlignItems: (v: string) => v ? applyClass(v) : removeCategory(ALIGN_ITEMS[0]),
    onGap:        (v: string) => v ? applyClass(`gap-${v}`) : removeCategory('gap-0'),
  };
}

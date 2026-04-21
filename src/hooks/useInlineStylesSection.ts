import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { parsedInlineStyleAtom, selectedElementAtom } from '@/atoms';
import { useStyleEditor } from './useStyleEditor';

export function useInlineStylesSection() {
  const raw = useAtomValue(parsedInlineStyleAtom);
  const elementId = useAtomValue(selectedElementAtom)?.id;
  // Stable reference: only change when content actually differs
  const serialized = JSON.stringify(raw);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const parsedInlineStyle = useMemo(() => raw, [serialized]);
  const { withDebounce, flushDebounce, applyLiveInlineProp, commitInlineStyle, removeInlineProp, addInlineProp } =
    useStyleEditor();
  return {
    parsedInlineStyle,
    elementId,
    withDebounce,
    flushDebounce,
    applyLiveInlineProp,
    commitInlineStyle,
    removeInlineProp,
    addInlineProp,
  };
}

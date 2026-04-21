import { useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { inspectModeAtom, selectedElementAtom, hoveredElementAtom } from '@/atoms';
import { useViewMode } from './useViewMode';

export function useInspectToggle() {
  const [inspectMode, setInspectMode] = useAtom(inspectModeAtom);
  const setSelected = useSetAtom(selectedElementAtom);
  const setHovered = useSetAtom(hoveredElementAtom);
  const { showPreview } = useViewMode();

  const toggleInspect = useCallback(() => {
    const next = !inspectMode;
    setInspectMode(next);
    if (!next) {
      setSelected(null);
      setHovered(null);
    }
    window.dispatchEvent(new CustomEvent('forge-inspect-toggle', { detail: { enabled: next } }));
  }, [inspectMode, setInspectMode, setSelected, setHovered]);

  return { inspectMode, toggleInspect, showInspect: showPreview };
}

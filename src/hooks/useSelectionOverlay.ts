import { useAtomValue } from 'jotai';
import { selectedElementAtom, hoveredElementAtom, inspectModeAtom } from '@/atoms';

function getIframeTopOffset(): number {
  const navigator = document.querySelector<HTMLElement>('.sp-navigator');
  return navigator ? navigator.getBoundingClientRect().height : 0;
}

export function useSelectionOverlay() {
  const selectedElement = useAtomValue(selectedElementAtom);
  const hoveredElement = useAtomValue(hoveredElementAtom);
  const inspectMode = useAtomValue(inspectModeAtom);

  const iframeTop = inspectMode ? getIframeTopOffset() : 0;

  return { selectedElement, hoveredElement, inspectMode, iframeTop };
}

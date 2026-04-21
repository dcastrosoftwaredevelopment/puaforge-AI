import { useAtomValue } from 'jotai';
import { selectedElementAtom, hoveredElementAtom, inspectModeAtom } from '@/atoms';

function getIframeOffset(): { top: number; left: number } {
  const overlay = document.querySelector<HTMLElement>('[data-forge-overlay]');
  const iframe = document.querySelector<HTMLIFrameElement>('.preview-iframe');
  if (!overlay || !iframe) {
    const nav = document.querySelector<HTMLElement>('.sp-navigator');
    return { top: nav?.getBoundingClientRect().height ?? 0, left: 0 };
  }
  const iframeRect = iframe.getBoundingClientRect();
  const overlayRect = overlay.getBoundingClientRect();
  return {
    top: iframeRect.top - overlayRect.top,
    left: iframeRect.left - overlayRect.left,
  };
}

export function useSelectionOverlay() {
  const selectedElement = useAtomValue(selectedElementAtom);
  const hoveredElement = useAtomValue(hoveredElementAtom);
  const inspectMode = useAtomValue(inspectModeAtom);

  const iframeOffset = inspectMode ? getIframeOffset() : { top: 0, left: 0 };

  return { selectedElement, hoveredElement, inspectMode, iframeOffset };
}

import { useAtomValue } from 'jotai';
import { selectedElementAtom, hoveredElementAtom, inspectModeAtom } from '@/atoms';

function getIframeViewportOrigin(): { top: number; left: number } {
  const iframe = document.querySelector<HTMLIFrameElement>('.sp-preview-iframe');
  if (!iframe) return { top: 0, left: 0 };
  const { top, left } = iframe.getBoundingClientRect();
  return { top, left };
}

export function useSelectionOverlay() {
  const selectedElement = useAtomValue(selectedElementAtom);
  const hoveredElement = useAtomValue(hoveredElementAtom);
  const inspectMode = useAtomValue(inspectModeAtom);

  const iframeOrigin = inspectMode ? getIframeViewportOrigin() : { top: 0, left: 0 };

  return { selectedElement, hoveredElement, inspectMode, iframeOrigin };
}

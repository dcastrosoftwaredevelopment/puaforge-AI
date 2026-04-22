import { useAtom, useAtomValue } from 'jotai';
import { selectedElementAtom, hoveredElementAtom, inspectModeAtom } from '@/atoms';
import { useFiles } from '@/hooks/useFiles';
import { removeBlockInstance } from '@/utils/jsxInserter';

function getIframeViewportOrigin(): { top: number; left: number } {
  const iframe = document.querySelector<HTMLIFrameElement>('.sp-preview-iframe');
  if (!iframe) return { top: 0, left: 0 };
  const { top, left } = iframe.getBoundingClientRect();
  return { top, left };
}

export function useSelectionOverlay() {
  const [selectedElement, setSelected] = useAtom(selectedElementAtom);
  const hoveredElement = useAtomValue(hoveredElementAtom);
  const inspectMode = useAtomValue(inspectModeAtom);
  const { setFiles } = useFiles();

  const iframeOrigin = inspectMode ? getIframeViewportOrigin() : { top: 0, left: 0 };

  function removeSelectedBlock() {
    const blockId = selectedElement?.forgeBlockId;
    if (!blockId) return;
    setFiles((prev) => ({ ...prev, '/App.tsx': removeBlockInstance(prev['/App.tsx'] ?? '', blockId) }));
    setSelected(null);
  }

  return { selectedElement, hoveredElement, inspectMode, iframeOrigin, removeSelectedBlock };
}

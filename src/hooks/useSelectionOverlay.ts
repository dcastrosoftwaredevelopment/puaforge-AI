import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { selectedElementAtom, hoveredElementAtom, inspectModeAtom, devicePreviewAtom } from '@/atoms';
import { useFiles } from '@/hooks/useFiles';
import { removeBlockInstance } from '@/utils/jsxInserter';

export function useSelectionOverlay() {
  const [selectedElement, setSelected] = useAtom(selectedElementAtom);
  const hoveredElement = useAtomValue(hoveredElementAtom);
  const setHovered = useSetAtom(hoveredElementAtom);
  const inspectMode = useAtomValue(inspectModeAtom);
  const devicePreview = useAtomValue(devicePreviewAtom);
  const { setFiles } = useFiles();

  // Clear stale hover rect when the device mode changes — the iframe reflows, so any
  // stored rect inside it is wrong. The user will naturally re-hover to see it again.
  useEffect(() => {
    setHovered(null);
  }, [devicePreview, setHovered]);

  function removeSelectedBlock() {
    const blockId = selectedElement?.forgeBlockId;
    if (!blockId) return;
    setFiles((prev) => ({ ...prev, '/App.tsx': removeBlockInstance(prev['/App.tsx'] ?? '', blockId) }));
    setSelected(null);
  }

  return { selectedElement, hoveredElement, inspectMode, removeSelectedBlock };
}

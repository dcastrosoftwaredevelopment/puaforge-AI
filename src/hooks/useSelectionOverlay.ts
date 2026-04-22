import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
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

  const [iframeOrigin, setIframeOrigin] = useState({ top: 0, left: 0 });
  const originRef = useRef(iframeOrigin);

  // Clear stale hover rect when the device mode changes — the iframe reflows, so any
  // stored rect inside it is wrong. The user will naturally re-hover to see it again.
  useEffect(() => {
    setHovered(null);
  }, [devicePreview, setHovered]);

  // Track the iframe's viewport origin reactively so the overlay stays aligned
  // during device-mode transitions (CSS transition-all duration-300 on the wrapper).
  // ResizeObserver fires on every animation frame where the iframe box changes,
  // giving us continuous updates throughout the transition.
  useEffect(() => {
    const iframe = document.querySelector<HTMLIFrameElement>('.sp-preview-iframe');
    if (!iframe) return;

    const update = () => {
      const { top, left } = iframe.getBoundingClientRect();
      if (originRef.current.top !== top || originRef.current.left !== left) {
        originRef.current = { top, left };
        setIframeOrigin({ top, left });
      }
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(iframe);
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  function removeSelectedBlock() {
    const blockId = selectedElement?.forgeBlockId;
    if (!blockId) return;
    setFiles((prev) => ({ ...prev, '/App.tsx': removeBlockInstance(prev['/App.tsx'] ?? '', blockId) }));
    setSelected(null);
  }

  return { selectedElement, hoveredElement, inspectMode, iframeOrigin, removeSelectedBlock };
}

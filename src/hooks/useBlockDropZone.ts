import { useEffect, useRef } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useSandpack, useActiveCode } from '@codesandbox/sandpack-react';
import { blockDragAtom, blockInsertParentAtom } from '@/atoms';
import { useFiles } from '@/hooks/useFiles';
import { useIncrementBlockRev } from '@/hooks/useBlockRevision';
import { insertBlockIntoApp, insertBlockInsideParent, generateInstanceId } from '@/utils/jsxInserter';
import { BLOCKS } from '@/utils/blockCatalog';

export function useBlockDropZone() {
  const { sandpack } = useSandpack();
  const sandpackRef = useRef(sandpack);
  useEffect(() => {
    sandpackRef.current = sandpack;
  });
  const { code: activeCode } = useActiveCode();
  const activeCodeRef = useRef(activeCode);
  useEffect(() => {
    activeCodeRef.current = activeCode;
  });
  const draggedBlock = useAtomValue(blockDragAtom);
  const setDraggedBlock = useSetAtom(blockDragAtom);
  const [insertParentId, setInsertParentId] = useAtom(blockInsertParentAtom);
  const { files, setFiles } = useFiles();
  const incrementBlockRev = useIncrementBlockRev();

  const isDragging = draggedBlock !== null;
  const isDraggingRef = useRef(isDragging);
  useEffect(() => {
    isDraggingRef.current = isDragging;
  });

  // Receive hit-test results from the preview iframe and update the insert target.
  // Sets the target when a container is found, clears it when cursor is over non-container area.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!isDraggingRef.current) return;
      if (!e.data || e.data.type !== 'FORGE_HIT_TEST_RESULT') return;
      const forgeBlockId: string = e.data.forgeBlockId || '';
      const blockId = forgeBlockId ? forgeBlockId.slice(0, forgeBlockId.lastIndexOf('-')) : '';
      const catalogIsContainer = !!BLOCKS.find((b) => b.id === blockId)?.isContainer;
      const htmlIsContainer = !!e.data.isContainer;
      setInsertParentId(catalogIsContainer || htmlIsContainer ? forgeBlockId : null);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [setInsertParentId]);

  const lastHitRef = useRef(0);

  function handleDragOver(e: React.DragEvent) {
    const now = Date.now();
    if (now - lastHitRef.current < 80) return;
    lastHitRef.current = now;
    const iframe = document.querySelector<HTMLIFrameElement>('.sp-preview-iframe');
    if (!iframe?.contentWindow) return;
    const rect = iframe.getBoundingClientRect();
    iframe.contentWindow.postMessage(
      { type: 'FORGE_HIT_TEST', x: e.clientX - rect.left, y: e.clientY - rect.top },
      '*',
    );
  }

  function handleDrop() {
    if (!draggedBlock) return;
    const block = BLOCKS.find((b) => b.id === draggedBlock.blockId);
    if (!block) return;
    const instanceId = generateInstanceId(block.id);
    const src = activeCodeRef.current || sandpackRef.current.files['/App.tsx']?.code || files['/App.tsx'] || '';
    const next =
      insertParentId ?
        insertBlockInsideParent(src, insertParentId, instanceId, block.code)
      : insertBlockIntoApp(src, instanceId, block.code);
    setDraggedBlock(null);
    setFiles((prev) => ({ ...prev, '/App.tsx': next }));
    incrementBlockRev();
  }

  return { isDragging, handleDrop, handleDragOver };
}

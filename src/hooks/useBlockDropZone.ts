import { useAtomValue } from 'jotai';
import { blockDragAtom } from '@/atoms';
import { useFiles } from '@/hooks/useFiles';
import { insertBlockIntoApp, generateInstanceId } from '@/utils/jsxInserter';
import { BLOCKS } from '@/utils/blockCatalog';

export function useBlockDropZone() {
  const draggedBlock = useAtomValue(blockDragAtom);
  const { files, setFiles } = useFiles();

  const isDragging = draggedBlock !== null;

  function handleDrop() {
    if (!draggedBlock) return;
    const block = BLOCKS.find((b) => b.id === draggedBlock.blockId);
    if (!block) return;
    const instanceId = generateInstanceId(block.id);
    setFiles((prev) => ({
      ...prev,
      '/App.tsx': insertBlockIntoApp(prev['/App.tsx'] ?? '', instanceId, block.code),
    }));
  }

  return { isDragging, handleDrop };
}

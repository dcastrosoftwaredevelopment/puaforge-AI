import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { blockDragAtom, blockInsertParentAtom } from '@/atoms';
import { useFiles } from '@/hooks/useFiles';
import { insertBlockIntoApp, insertBlockInsideParent, generateInstanceId } from '@/utils/jsxInserter';
import { BLOCKS } from '@/utils/blockCatalog';

export function useBlockDropZone() {
  const { t } = useTranslation();
  const draggedBlock = useAtomValue(blockDragAtom);
  const insertParentId = useAtomValue(blockInsertParentAtom);
  const { setFiles } = useFiles();

  const isDragging = draggedBlock !== null;

  // Resolve a human-readable label for the current drop target
  const dropTargetLabel = useMemo(() => {
    if (!insertParentId) return null;
    const blockId = insertParentId.slice(0, insertParentId.lastIndexOf('-'));
    const block = BLOCKS.find((b) => b.id === blockId);
    return block ? t(block.labelKey) : null;
  }, [insertParentId, t]);

  function handleDrop() {
    if (!draggedBlock) return;
    const block = BLOCKS.find((b) => b.id === draggedBlock.blockId);
    if (!block) return;
    const instanceId = generateInstanceId(block.id);
    setFiles((prev) => {
      const source = prev['/App.tsx'] ?? '';
      const next =
        insertParentId ?
          insertBlockInsideParent(source, insertParentId, instanceId, block.code)
        : insertBlockIntoApp(source, instanceId, block.code);
      return { ...prev, '/App.tsx': next };
    });
  }

  return { isDragging, handleDrop, dropTargetLabel };
}

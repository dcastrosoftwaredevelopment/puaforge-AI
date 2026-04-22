import { useAtom } from 'jotai';
import { blockDragAtom } from '@/atoms';
import type { Block } from '@/utils/blockCatalog';

export function useBlockDrag() {
  const [draggedBlock, setDraggedBlock] = useAtom(blockDragAtom);

  function startDrag(block: Block) {
    setDraggedBlock({ blockId: block.id, code: block.code });
  }

  function endDrag() {
    setDraggedBlock(null);
  }

  return { draggedBlock, startDrag, endDrag };
}

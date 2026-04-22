import { useMemo, useState } from 'react';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useFiles } from '@/hooks/useFiles';
import { blockInsertParentAtom } from '@/atoms';
import { BLOCKS, type Block } from '@/utils/blockCatalog';
import {
  insertBlockIntoApp,
  insertBlockInsideParent,
  removeLastBlockInstance,
  countBlockInstances,
  generateInstanceId,
} from '@/utils/jsxInserter';

export function useBlockLibrary() {
  const { files, setFiles } = useFiles();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Block | null>(null);
  const [insertParentId, setInsertParentId] = useAtom(blockInsertParentAtom);

  const appSource = files['/App.tsx'] ?? '';

  const instanceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const block of BLOCKS) {
      const n = countBlockInstances(appSource, block.id);
      if (n > 0) counts[block.id] = n;
    }
    return counts;
  }, [appSource]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return BLOCKS;
    return BLOCKS.filter((b) => t(b.labelKey).toLowerCase().includes(q));
  }, [query, t]);

  function insertBlock(block: Block) {
    const childInstanceId = generateInstanceId(block.id);
    setFiles((prev) => {
      const source = prev['/App.tsx'] ?? '';
      const next =
        insertParentId ?
          insertBlockInsideParent(source, insertParentId, childInstanceId, block.code)
        : insertBlockIntoApp(source, childInstanceId, block.code);
      return { ...prev, '/App.tsx': next };
    });
    // Newly inserted containers auto-become the active parent
    if (block.isContainer) {
      setInsertParentId(childInstanceId);
    }
  }

  function removeBlock(block: Block) {
    setFiles((prev) => ({
      ...prev,
      '/App.tsx': removeLastBlockInstance(prev['/App.tsx'] ?? '', block.id),
    }));
    // If the active parent belongs to the removed block type, clear it
    if (insertParentId) {
      const parentBlockId = insertParentId.slice(0, insertParentId.lastIndexOf('-'));
      if (parentBlockId === block.id) setInsertParentId(null);
    }
  }

  return {
    query,
    setQuery,
    filtered,
    selected,
    setSelected,
    instanceCounts,
    hasActiveParent: insertParentId !== null,
    insertBlock,
    removeBlock,
  };
}

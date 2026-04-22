import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFiles } from '@/hooks/useFiles';
import { BLOCKS, type Block } from '@/utils/blockCatalog';
import {
  insertBlockIntoApp,
  insertBlockInsideParent,
  removeLastBlockInstance,
  countBlockInstances,
  getBlockInstances,
  generateInstanceId,
} from '@/utils/jsxInserter';

export interface InsertedContainer {
  instanceId: string;
  blockId: string;
  labelKey: string;
  index: number;
}

export function useBlockLibrary() {
  const { files, setFiles } = useFiles();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Block | null>(null);
  const [insertParent, setInsertParent] = useState<InsertedContainer | null>(null);

  const appSource = files['/App.tsx'] ?? '';

  const instanceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const block of BLOCKS) {
      const n = countBlockInstances(appSource, block.id);
      if (n > 0) counts[block.id] = n;
    }
    return counts;
  }, [appSource]);

  // All inserted container instances in document order
  const insertedContainers = useMemo((): InsertedContainer[] => {
    const containerIds = new Set(BLOCKS.filter((b) => b.isContainer).map((b) => b.id));
    return getBlockInstances(appSource)
      .filter((inst) => containerIds.has(inst.blockId))
      .map((inst, index) => {
        const block = BLOCKS.find((b) => b.id === inst.blockId)!;
        return { instanceId: inst.instanceId, blockId: inst.blockId, labelKey: block.labelKey, index };
      });
  }, [appSource]);

  // Clear parent if it no longer exists in the source
  const activeParent = useMemo((): InsertedContainer | null => {
    if (!insertParent) return null;
    return insertedContainers.find((c) => c.instanceId === insertParent.instanceId) ?? null;
  }, [insertParent, insertedContainers]);

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
        activeParent ?
          insertBlockInsideParent(source, activeParent.instanceId, childInstanceId, block.code)
        : insertBlockIntoApp(source, childInstanceId, block.code);
      return { ...prev, '/App.tsx': next };
    });
  }

  function removeBlock(block: Block) {
    setFiles((prev) => ({
      ...prev,
      '/App.tsx': removeLastBlockInstance(prev['/App.tsx'] ?? '', block.id),
    }));
    if (activeParent?.blockId === block.id) setInsertParent(null);
  }

  function selectParent(container: InsertedContainer | null) {
    setInsertParent(container);
  }

  return {
    query,
    setQuery,
    filtered,
    selected,
    setSelected,
    instanceCounts,
    insertedContainers,
    activeParent,
    selectParent,
    insertBlock,
    removeBlock,
  };
}

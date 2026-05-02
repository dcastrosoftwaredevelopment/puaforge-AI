import { useMemo, useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useSandpack, useActiveCode } from '@codesandbox/sandpack-react';
import { useFiles } from '@/hooks/useFiles';
import { useIncrementBlockRev } from '@/hooks/useBlockRevision';
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
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Block | null>(null);
  const [insertParentId, setInsertParentId] = useAtom(blockInsertParentAtom);
  const incrementBlockRev = useIncrementBlockRev();

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

  const dropTargetLabel = useMemo(() => {
    if (!insertParentId) return null;
    const blockId = insertParentId.slice(0, insertParentId.lastIndexOf('-'));
    const block = BLOCKS.find((b) => b.id === blockId);
    return block ? t(block.labelKey) : null;
  }, [insertParentId, t]);

  function clearInsertParent() {
    setInsertParentId(null);
  }

  function insertBlock(block: Block) {
    const childInstanceId = generateInstanceId(block.id);
    // activeCodeRef.current is live editor content — preserves unsaved keystrokes.
    const source = activeCodeRef.current || sandpackRef.current.files['/App.tsx']?.code || files['/App.tsx'] || '';
    const next =
      insertParentId ?
        insertBlockInsideParent(source, insertParentId, childInstanceId, block.code)
      : insertBlockIntoApp(source, childInstanceId, block.code);
    setFiles((prev) => ({ ...prev, '/App.tsx': next }));
    incrementBlockRev();
  }

  function removeBlock(block: Block) {
    const source = activeCodeRef.current || sandpackRef.current.files['/App.tsx']?.code || files['/App.tsx'] || '';
    setFiles((prev) => ({ ...prev, '/App.tsx': removeLastBlockInstance(source, block.id) }));
    if (insertParentId) {
      const parentBlockId = insertParentId.slice(0, insertParentId.lastIndexOf('-'));
      if (parentBlockId === block.id) setInsertParentId(null);
    }
    incrementBlockRev();
  }

  return {
    query,
    setQuery,
    filtered,
    selected,
    setSelected,
    instanceCounts,
    hasActiveParent: insertParentId !== null,
    dropTargetLabel,
    clearInsertParent,
    insertBlock,
    removeBlock,
  };
}

import { useCallback, useState } from 'react';
import { useAtomValue } from 'jotai';
import { domTreeAtom, selectedElementAtom } from '@/atoms';

export function useLayersPanel() {
  const domTree = useAtomValue(domTreeAtom);
  const selectedElement = useAtomValue(selectedElementAtom);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const selectById = useCallback((id: string) => {
    window.dispatchEvent(new CustomEvent('forge-select-by-id', { detail: { id, stayInLayers: true } }));
  }, []);

  const goToStyleById = useCallback((id: string) => {
    window.dispatchEvent(new CustomEvent('forge-select-by-id', { detail: { id, stayInLayers: false } }));
  }, []);

  const hoverById = useCallback((id: string) => {
    window.dispatchEvent(new CustomEvent('forge-hover-by-id', { detail: { id } }));
  }, []);

  const clearHover = useCallback(() => {
    window.dispatchEvent(new CustomEvent('forge-hover-by-id', { detail: { id: '' } }));
  }, []);

  const refreshTree = useCallback(() => {
    window.dispatchEvent(new CustomEvent('forge-refresh-tree', { detail: {} }));
  }, []);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, []);

  return { domTree, selectedElement, search, setSearch, collapsed, toggleCollapse, selectById, goToStyleById, hoverById, clearHover, refreshTree };
}

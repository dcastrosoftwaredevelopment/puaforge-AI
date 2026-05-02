import { useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useSandpack } from '@codesandbox/sandpack-react';
import {
  selectedElementAtom,
  hoveredElementAtom,
  domTreeAtom,
  editorPanelModeAtom,
  inspectModeAtom,
  blockInsertParentAtom,
  blockDragAtom,
  type SelectedElement,
  type DOMNode,
} from '@/atoms';
import { BLOCKS } from '@/utils/blockCatalog';
import { useFileWriter } from '@/hooks/useFileWriter';
import { useIncrementBlockRev } from '@/hooks/useBlockRevision';
import { removeBlockInstance } from '@/utils/jsxInserter';

/**
 * Bridges postMessage traffic between the platform and the Sandpack preview iframe.
 * Must be called exactly ONCE, inside SandpackProvider (via SandpackSyncBridge).
 *
 * Uses sandpack.clients to get the actual preview iframe registered by <SandpackPreview>.
 * Outbound: listens for CustomEvents dispatched on window, forwards to iframe via postMessage.
 * Inbound: listens for window.message events from the preview iframe.
 */
export function useInspectBridge() {
  const { sandpack } = useSandpack();
  const sandpackRef = useRef(sandpack);
  const inspectMode = useAtomValue(inspectModeAtom);
  const inspectModeRef = useRef(inspectMode);
  const setSelected = useSetAtom(selectedElementAtom);
  const setHovered = useSetAtom(hoveredElementAtom);
  const setDomTree = useSetAtom(domTreeAtom);
  const setPanelMode = useSetAtom(editorPanelModeAtom);
  const setInsertParentId = useSetAtom(blockInsertParentAtom);
  const insertParentId = useAtomValue(blockInsertParentAtom);
  const draggedBlock = useAtomValue(blockDragAtom);
  const isDragging = draggedBlock !== null;
  const writeFiles = useFileWriter();
  const incrementBlockRev = useIncrementBlockRev();

  // No deps — runs after every render so sandpackRef never points to a stale context.
  useEffect(() => {
    sandpackRef.current = sandpack;
  });
  useEffect(() => {
    inspectModeRef.current = inspectMode;
  }, [inspectMode]);

  const post = (msg: object) => {
    let sent = false;
    for (const client of Object.values(sandpackRef.current.clients)) {
      if (client.iframe?.contentWindow) {
        client.iframe.contentWindow.postMessage(msg, '*');
        sent = true;
      }
    }
    if (!sent) {
      document.querySelector<HTMLIFrameElement>('.sp-preview-iframe')?.contentWindow?.postMessage(msg, '*');
    }
  };

  // Re-sync inspect state after Sandpack preview reloads (iframe loses state on refresh)
  useEffect(() => {
    if (sandpack.status !== 'running') return;
    const timer = setTimeout(() => {
      if (inspectModeRef.current) {
        post({ type: 'FORGE_INSPECT_TOGGLE', enabled: true });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [sandpack.status]);

  // Send drop-target highlight to iframe whenever the drag target changes.
  // Only highlight catalog containers — template blocks (e.g. welcome-root) are valid
  // drop targets but cover the entire viewport, so showing the rect for them looks wrong.
  // Also clear the inspect selectedBox when drag starts so the two overlays don't conflict.
  // post closes over sandpackRef (stable ref) — not needed in deps.
  useEffect(() => {
    if (isDragging) post({ type: 'FORGE_DESELECT' });

    let highlightId = '';
    if (isDragging && insertParentId) {
      const blockId = insertParentId.slice(0, insertParentId.lastIndexOf('-'));
      const isCatalogContainer = !!BLOCKS.find((b) => b.id === blockId)?.isContainer;
      if (isCatalogContainer) highlightId = insertParentId;
    }
    post({ type: 'FORGE_HIGHLIGHT_DROP_TARGET', forgeBlockId: highlightId });
  }, [isDragging, insertParentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Forward platform CustomEvents → iframe postMessages
  useEffect(() => {
    const onToggle = (e: Event) => post({ type: 'FORGE_INSPECT_TOGGLE', enabled: (e as CustomEvent).detail.enabled });
    const onSelectById = (e: Event) =>
      post({
        type: 'FORGE_SELECT_BY_ID',
        id: (e as CustomEvent).detail.id,
        stayInLayers: !!(e as CustomEvent).detail.stayInLayers,
      });
    const onHoverById = (e: Event) => post({ type: 'FORGE_HOVER_BY_ID', id: (e as CustomEvent).detail.id });
    const onRefreshTree = () => post({ type: 'FORGE_REFRESH_TREE' });
    const onSelectBlockRoot = (e: Event) =>
      post({ type: 'FORGE_SELECT_BLOCK_ROOT', forgeBlockId: (e as CustomEvent).detail.forgeBlockId });

    window.addEventListener('forge-inspect-toggle', onToggle);
    window.addEventListener('forge-select-by-id', onSelectById);
    window.addEventListener('forge-hover-by-id', onHoverById);
    window.addEventListener('forge-refresh-tree', onRefreshTree);
    window.addEventListener('forge-select-block-root', onSelectBlockRoot);

    return () => {
      window.removeEventListener('forge-inspect-toggle', onToggle);
      window.removeEventListener('forge-select-by-id', onSelectById);
      window.removeEventListener('forge-hover-by-id', onHoverById);
      window.removeEventListener('forge-refresh-tree', onRefreshTree);
      window.removeEventListener('forge-select-block-root', onSelectBlockRoot);
    };
  }, []); // stable — closes over sandpackRef (a stable object)

  // Receive iframe → platform messages
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;
      const { type } = e.data;

      if (type === 'FORGE_READY') {
        if (inspectModeRef.current) post({ type: 'FORGE_INSPECT_TOGGLE', enabled: true });
      } else if (type === 'FORGE_ELEMENT_SELECTED') {
        const el: SelectedElement = {
          id: e.data.id,
          tagName: e.data.tagName,
          className: e.data.className,
          inlineStyle: e.data.inlineStyle || '',
          isBlockRoot: !!e.data.isBlockRoot,
          forgeBlockId: e.data.forgeBlockId || '',
          attributes: (e.data.attributes as Record<string, string>) || {},
          textContent: e.data.textContent as string | undefined,
          rect: e.data.rect,
        };
        setSelected(el);
        // Sync inspect selection → block insert target.
        // Only containers are valid drop targets; anything else resets to root.
        const forgeBlockId = e.data.forgeBlockId || '';
        const blockId = forgeBlockId ? forgeBlockId.slice(0, forgeBlockId.lastIndexOf('-')) : '';
        const isContainer = !!BLOCKS.find((b) => b.id === blockId)?.isContainer;
        if (isContainer) setInsertParentId(forgeBlockId);
        // Only open the style panel on a second click on the same element,
        // so a single click just selects without disrupting the active panel.
        if (!e.data.stayInLayers && e.data.isReselect) setPanelMode('style');
      } else if (type === 'FORGE_ELEMENT_RESIZED') {
        const rect = e.data.rect;
        setSelected((prev) => (prev ? { ...prev, rect } : null));
      } else if (type === 'FORGE_ELEMENT_HOVERED') {
        const el: SelectedElement = {
          id: e.data.id,
          tagName: e.data.tagName,
          className: e.data.className,
          inlineStyle: e.data.inlineStyle || '',
          forgeBlockId: e.data.forgeBlockId || '',
          attributes: (e.data.attributes as Record<string, string>) || {},
          textContent: e.data.textContent as string | undefined,
          rect: e.data.rect,
        };
        setHovered(el);
      } else if (type === 'FORGE_DOM_TREE') {
        setDomTree(e.data.tree as DOMNode[]);
      } else if (type === 'FORGE_REMOVE_BLOCK') {
        const blockId = e.data.forgeBlockId as string;
        if (!blockId) return;
        // Read live Sandpack content — filesAtom is stale when editor has unsaved keystrokes.
        const source = sandpackRef.current.files['/App.tsx']?.code ?? '';
        writeFiles([['/App.tsx', removeBlockInstance(source, blockId)]]);
        setSelected(null);
        incrementBlockRev();
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [setSelected, setHovered, setDomTree, setPanelMode, writeFiles, setInsertParentId, incrementBlockRev]);
}

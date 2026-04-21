import { useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useSandpack } from '@codesandbox/sandpack-react';
import {
  selectedElementAtom,
  hoveredElementAtom,
  domTreeAtom,
  editorPanelModeAtom,
  inspectModeAtom,
  type SelectedElement,
  type DOMNode,
} from '@/atoms';

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

  useEffect(() => { sandpackRef.current = sandpack; }, [sandpack]);
  useEffect(() => { inspectModeRef.current = inspectMode; }, [inspectMode]);

  const post = (msg: object) => {
    let sent = false;
    for (const client of Object.values(sandpackRef.current.clients)) {
      if (client.iframe?.contentWindow) {
        client.iframe.contentWindow.postMessage(msg, '*');
        sent = true;
      }
    }
    if (!sent) {
      document.querySelector<HTMLIFrameElement>('.preview-iframe')
        ?.contentWindow?.postMessage(msg, '*');
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

  // Forward platform CustomEvents → iframe postMessages
  useEffect(() => {
    const onToggle = (e: Event) => post({ type: 'FORGE_INSPECT_TOGGLE', enabled: (e as CustomEvent).detail.enabled });
    const onSelectById = (e: Event) => post({ type: 'FORGE_SELECT_BY_ID', id: (e as CustomEvent).detail.id, stayInLayers: !!(e as CustomEvent).detail.stayInLayers });
    const onHoverById = (e: Event) => post({ type: 'FORGE_HOVER_BY_ID', id: (e as CustomEvent).detail.id });
    const onRefreshTree = () => post({ type: 'FORGE_REFRESH_TREE' });

    window.addEventListener('forge-inspect-toggle', onToggle);
    window.addEventListener('forge-select-by-id', onSelectById);
    window.addEventListener('forge-hover-by-id', onHoverById);
    window.addEventListener('forge-refresh-tree', onRefreshTree);

    return () => {
      window.removeEventListener('forge-inspect-toggle', onToggle);
      window.removeEventListener('forge-select-by-id', onSelectById);
      window.removeEventListener('forge-hover-by-id', onHoverById);
      window.removeEventListener('forge-refresh-tree', onRefreshTree);
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
        const el: SelectedElement = { id: e.data.id, tagName: e.data.tagName, className: e.data.className, inlineStyle: e.data.inlineStyle || '', rect: e.data.rect };
        setSelected(el);
        if (!e.data.stayInLayers) setPanelMode('style');
      } else if (type === 'FORGE_ELEMENT_RESIZED') {
        const rect = e.data.rect;
        setSelected((prev) => prev ? { ...prev, rect } : null);
      } else if (type === 'FORGE_ELEMENT_HOVERED') {
        const el: SelectedElement = { id: e.data.id, tagName: e.data.tagName, className: e.data.className, inlineStyle: e.data.inlineStyle || '', rect: e.data.rect };
        setHovered(el);
      } else if (type === 'FORGE_DOM_TREE') {
        setDomTree(e.data.tree as DOMNode[]);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [setSelected, setHovered, setDomTree, setPanelMode]);
}

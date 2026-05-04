import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSandpack } from '@codesandbox/sandpack-react';
import { lsGet, lsSet } from './usePersistence';

/**
 * Persists the Sandpack open tabs (visibleFiles) to localStorage so they survive
 * SandpackProvider remounts (triggered by sandpackKey changes from deps or blockRev).
 * Must be called inside SandpackProvider (via SandpackSyncBridge).
 *
 * On mount: calls openFile for any saved tab Sandpack filtered from its initial
 * visibleFiles (Sandpack only applies options.visibleFiles for files it has already
 * registered in its files state, so some tabs may be silently dropped).
 *
 * On tab change: saves only when visibleFiles actually changes from the initial
 * value, which handles React StrictMode's double-invocation of effects.
 */
export function useSandpackTabSync() {
  const { projectId } = useParams<{ projectId: string }>();
  const { sandpack } = useSandpack();
  const tabsKey = JSON.stringify(sandpack.visibleFiles);
  const initialTabsKeyRef = useRef<string | null>(null);

  // On mount: restore any saved tabs that Sandpack filtered out of its initial visibleFiles.
  // Sandpack's getSandpackStateFromProps filters options.visibleFiles to only include files
  // present in its internal files state at init time — CSS files are sometimes excluded.
  useEffect(() => {
    if (!projectId) return;
    const saved = lsGet(`openTabs:${projectId}`);
    if (!saved) return;
    try {
      const savedTabs: string[] = JSON.parse(saved);
      const currentVisible = new Set(sandpack.visibleFiles);
      const activeFileBefore = sandpack.activeFile;
      let opened = false;
      for (const path of savedTabs) {
        if (!currentVisible.has(path) && sandpack.files[path] !== undefined) {
          sandpack.openFile(path);
          opened = true;
        }
      }
      // openFile changes activeFile — restore it to what it was before
      if (opened) sandpack.setActiveFile(activeFileBefore);
    } catch {
      // ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist tabs whenever visibleFiles changes AFTER the initial render.
  // Using initialTabsKeyRef instead of isFirstRender so that React StrictMode's
  // double-invocation of effects (which re-runs with the same initial value) is
  // also skipped — the save only fires when the value genuinely changes.
  useEffect(() => {
    if (!projectId) return;
    if (initialTabsKeyRef.current === null) {
      initialTabsKeyRef.current = tabsKey;
      return;
    }
    if (tabsKey === initialTabsKeyRef.current) return;
    initialTabsKeyRef.current = tabsKey;
    lsSet(`openTabs:${projectId}`, tabsKey);
  }, [tabsKey, projectId]);
}

import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSandpack } from '@codesandbox/sandpack-react';
import { useFiles } from './useFiles';
import { useIncrementBlockRev } from './useBlockRevision';
import { lsGet, lsSet } from './usePersistence';
import { FORGE_INSPECT_SOURCE } from '@/utils/inspectFiles';

/**
 * Syncs filesAtom changes into Sandpack's internal state.
 * Editor changes stay in Sandpack's internal state only — no setFiles on keystrokes,
 * which would trigger dep extraction, sandpackKey change, and a full Provider remount.
 * Style patcher reads from sandpackRef.current.files (always current) rather than
 * filesAtom so code editor edits are never lost when styles are applied.
 * Must be rendered inside <SandpackProvider>.
 */
export function useSandpackSync() {
  const { projectId } = useParams<{ projectId: string }>();
  const { files } = useFiles();
  const { sandpack } = useSandpack();
  const sandpackRef = useRef(sandpack);
  const prevFilesRef = useRef(files);
  const isFirstRunRef = useRef(true);
  const incrementBlockRev = useIncrementBlockRev();

  useEffect(() => {
    sandpackRef.current = sandpack;
  });

  // Always push the current FORGE_INSPECT_SOURCE to the sandbox on mount.
  // The file is set once at SandpackProvider initialization so HMR/cache can leave
  // the iframe running a stale version — unconditional updateFile forces a rebundle.
  useEffect(() => {
    sandpackRef.current.updateFile('/__forgeInspect.tsx', FORGE_INSPECT_SOURCE);
  }, []);

  // Push atom changes → Sandpack (skip first run, Provider already has correct files).
  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    const sp = sandpackRef.current;
    const prevFiles = prevFilesRef.current;
    prevFilesRef.current = files;

    const currentPaths = new Set(Object.keys(files));
    for (const path of Object.keys(prevFiles)) {
      if (!currentPaths.has(path) && path !== '/index.html') {
        sp.deleteFile(path);
      }
    }

    for (const [path, fileCode] of Object.entries(files)) {
      if (prevFiles[path] !== fileCode) {
        if (prevFiles[path] === undefined) {
          // New file: add to open tabs in localStorage, then remount via blockRev so
          // the file lands in the initial files prop AND visibleFiles of SandpackProvider.
          const saved = lsGet(`openTabs:${projectId}`);
          let tabs: string[];
          try {
            tabs = saved ? (JSON.parse(saved) as string[]) : ['/App.tsx'];
          } catch {
            tabs = ['/App.tsx'];
          }
          if (!tabs.includes(path)) {
            lsSet(`openTabs:${projectId}`, JSON.stringify([...tabs, path]));
          }
          incrementBlockRev();
        } else {
          sp.updateFile(path, fileCode);
        }
      }
    }
  }, [files]); // eslint-disable-line react-hooks/exhaustive-deps
}

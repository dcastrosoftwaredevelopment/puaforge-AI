import { useEffect, useRef } from 'react';
import { useSandpack } from '@codesandbox/sandpack-react';
import { useFiles } from './useFiles';
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
  const { files } = useFiles();
  const { sandpack } = useSandpack();
  const sandpackRef = useRef(sandpack);
  const prevFilesRef = useRef(files);
  const isFirstRunRef = useRef(true);

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
        sp.updateFile(path, fileCode);
        if (prevFiles[path] === undefined) {
          const p = path;
          setTimeout(() => sandpackRef.current.openFile(p), 0);
        }
      }
    }
  }, [files]);
}

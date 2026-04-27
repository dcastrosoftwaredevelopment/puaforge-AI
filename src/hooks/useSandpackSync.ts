import { useEffect, useRef } from 'react';
import { useSandpack, useActiveCode } from '@codesandbox/sandpack-react';
import { useFiles } from './useFiles';
import { FORGE_INSPECT_SOURCE } from '@/utils/inspectFiles';

/**
 * Syncs filesAtom changes into Sandpack's internal state.
 * Also syncs active-file edits back to filesAtom via useActiveCode (event-driven,
 * replaces the old 800ms polling approach).
 * Must be rendered inside <SandpackProvider>.
 */
export function useSandpackSync() {
  const { files, setFiles } = useFiles();
  const { sandpack } = useSandpack();
  const { code } = useActiveCode();
  const sandpackRef = useRef(sandpack);
  const prevFilesRef = useRef(files);
  const isFirstRunRef = useRef(true);
  // Prevents the filesAtom→Sandpack push from firing when auto-sync triggers setFiles
  const isAutoSyncRef = useRef(false);
  // Tracks last code synced per file to avoid redundant setFiles calls on file switch
  const lastSyncedCodeRef = useRef<Record<string, string>>({});

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
  // When the change came from the editor auto-sync, skip the push to avoid feedback loop.
  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    if (isAutoSyncRef.current) {
      isAutoSyncRef.current = false;
      prevFilesRef.current = files;
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
          sp.openFile(path);
        }
      }
    }
  }, [files]);

  // Sync active-file edits → filesAtom (event-driven via useActiveCode, no polling).
  // Guard prevents redundant updates when switching between files.
  useEffect(() => {
    const activeFile = sandpackRef.current.activeFile;
    if (!activeFile || activeFile.startsWith('/__')) return;
    if (lastSyncedCodeRef.current[activeFile] === code) return;
    lastSyncedCodeRef.current[activeFile] = code;
    isAutoSyncRef.current = true;
    setFiles((prev) => ({ ...prev, [activeFile]: code }));
  }, [code, setFiles]);
}

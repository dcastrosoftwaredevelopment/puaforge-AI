import { useEffect, useRef } from 'react';
import { useSandpack } from '@codesandbox/sandpack-react';
import { useFiles } from './useFiles';
import { FORGE_INSPECT_SOURCE } from '@/utils/inspectFiles';

/**
 * Syncs filesAtom changes into Sandpack's internal state.
 * Also auto-syncs Sandpack editor changes back to filesAtom so the style patcher
 * always operates on the latest code without requiring an explicit save.
 * Must be rendered inside <SandpackProvider>.
 */
export function useSandpackSync() {
  const { files, setFiles } = useFiles();
  const { sandpack } = useSandpack();
  const sandpackRef = useRef(sandpack);
  const prevFilesRef = useRef(files);
  const isFirstRunRef = useRef(true);
  // Prevents the filesAtom→Sandpack push from firing when auto-sync triggers setFiles
  const isAutoSyncRef = useRef(false);

  useEffect(() => {
    sandpackRef.current = sandpack;
  });

  // Always push the current FORGE_INSPECT_SOURCE to the sandbox on mount.
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

    for (const [path, code] of Object.entries(files)) {
      sp.updateFile(path, code);
    }
  }, [files]);

  // Detect user edits in the Sandpack editor and immediately sync filesAtom.
  // The isAutoSyncRef flag prevents the filesAtom→Sandpack push from re-firing.
  useEffect(() => {
    const interval = setInterval(() => {
      const spFiles = sandpackRef.current.files;
      const updated: Record<string, string> = {};
      let changed = false;
      for (const [path, file] of Object.entries(spFiles)) {
        if (path === '/index.html' || path === '/package.json') continue;
        if (typeof file === 'object' && file.hidden) continue;
        const code = typeof file === 'string' ? file : file.code;
        updated[path] = code;
        if (prevFilesRef.current[path] !== undefined && prevFilesRef.current[path] !== code) {
          changed = true;
        }
      }
      if (changed) {
        isAutoSyncRef.current = true;
        setFiles(updated);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [setFiles]);
}

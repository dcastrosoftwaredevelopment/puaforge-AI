import { useCallback, useEffect, useRef } from 'react';
import { useSetAtom } from 'jotai';
import { useSandpack } from '@codesandbox/sandpack-react';
import { editorActionsAtom } from '@/atoms';
import { useFiles } from './useFiles';
import { useEditorState } from './useEditorState';

/**
 * Syncs filesAtom changes into Sandpack's internal state.
 * Also auto-syncs Sandpack editor changes back to filesAtom so the style patcher
 * always operates on the latest code without requiring an explicit save.
 * Must be rendered inside <SandpackProvider>.
 */
export function useSandpackSync() {
  const { files, setFiles } = useFiles();
  const { sandpack } = useSandpack();
  const { isDirty, setDirty } = useEditorState();
  const setActions = useSetAtom(editorActionsAtom);
  const sandpackRef = useRef(sandpack);
  const prevFilesRef = useRef(files);
  const isFirstRunRef = useRef(true);
  const isDirtyRef = useRef(isDirty);
  // Prevents the filesAtom→Sandpack push from firing when auto-sync triggers setFiles
  const isAutoSyncRef = useRef(false);
  // Snapshot captured at the start of a manual edit session (used for Discard)
  const preEditSnapshotRef = useRef<Record<string, string> | null>(null);

  useEffect(() => {
    sandpackRef.current = sandpack;
  });
  useEffect(() => {
    isDirtyRef.current = isDirty;
  });

  // Push atom changes → Sandpack (skip first run, Provider already has correct files).
  // When the change came from the editor auto-sync, skip the push and dirty-clear
  // to avoid an unnecessary Sandpack update and to preserve the dirty state.
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

    setDirty(false);
  }, [files, setDirty]);

  // Detect user edits in the Sandpack editor. When a change is found:
  // - capture a pre-edit snapshot for potential Discard
  // - immediately sync filesAtom with the live Sandpack state (no manual Save needed)
  // - set dirty so the EditBar appears and chat is disabled
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirtyRef.current) return;
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
        preEditSnapshotRef.current = { ...prevFilesRef.current };
        isAutoSyncRef.current = true;
        setFiles(updated);
        setDirty(true);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [setDirty, setFiles]);

  // Discard: revert Sandpack and filesAtom to the state captured before editing started
  const discardEdits = useCallback(() => {
    const snapshot = preEditSnapshotRef.current ?? prevFilesRef.current;
    const sp = sandpackRef.current;
    for (const [path, code] of Object.entries(snapshot)) {
      sp.updateFile(path, code);
    }
    isAutoSyncRef.current = true;
    setFiles({ ...snapshot });
    preEditSnapshotRef.current = null;
    setDirty(false);
  }, [setFiles, setDirty]);

  useEffect(() => {
    setActions({ save: () => {}, discard: discardEdits });
  }, [discardEdits, setActions]);
}

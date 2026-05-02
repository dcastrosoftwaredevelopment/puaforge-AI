import { useCallback, useEffect, useRef } from 'react';
import { useSetAtom } from 'jotai';
import { useSandpack } from '@codesandbox/sandpack-react';
import { filesAtom } from '@/atoms';
import { stylePushedPaths } from './useSandpackSync';

/**
 * Returns a stable write function that applies file updates via the triple-write pattern:
 * 1. Mark the path in stylePushedPaths so useSandpackSync skips re-pushing it.
 * 2. Push directly to Sandpack so CodeMirror reflects the change immediately.
 * 3. Update filesAtom so the rest of the app stays in sync.
 *
 * This prevents useSandpackSync from overwriting live editor keystrokes that haven't
 * been flushed to filesAtom yet.
 */
export function useFileWriter() {
  const { sandpack } = useSandpack();
  const sandpackRef = useRef(sandpack);
  useEffect(() => {
    sandpackRef.current = sandpack;
  });
  const setFiles = useSetAtom(filesAtom);

  return useCallback(
    (updates: Array<[string, string]>) => {
      for (const [path, content] of updates) {
        stylePushedPaths.set(path, content);
        sandpackRef.current.updateFile(path, content);
      }
      setFiles((prev) => {
        const next = { ...prev };
        for (const [path, content] of updates) next[path] = content;
        return next;
      });
    },
    [setFiles],
  );
}

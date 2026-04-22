import { createContext, useCallback, useEffect, useRef } from 'react';
import { useStore, useSetAtom } from 'jotai';
import { useSandpack } from '@codesandbox/sandpack-react';
import { filesAtom, selectedElementAtom } from '@/atoms';
import { toJSXStyleObject } from '@/utils/inlineStyles';

type StylePatcherValue = {
  applyClassChange: (old: string, next: string) => void;
  applyInlineStyleChange: (old: string, next: string) => void;
};

export const StylePatcherContext = createContext<StylePatcherValue>({
  applyClassChange: () => {},
  applyInlineStyleChange: () => {},
});

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function patchCode(code: string, oldClass: string, newClass: string): string {
  const esc = escapeRegex(oldClass);
  const replace = (_m: string, p1: string, p2: string) => `${p1}${newClass}${p2}`;
  return code
    .replace(new RegExp(`(className\\s*=\\s*")${esc}(")`, 'g'), replace)
    .replace(new RegExp(`(className\\s*=\\s*')${esc}(')`, 'g'), replace)
    .replace(new RegExp(`(className\\s*=\\s*\\{'")${esc}("'\\})`, 'g'), replace);
}

/**
 * Scoped className patch: finds the specific JSX element with data-forge-block-id
 * and replaces className only within that opening tag, preventing false positives
 * when two elements share the same className string (e.g. nested containers).
 *
 * Falls back to forge-block-range scoping, then to global, in that order.
 */
function patchClassNameForElement(code: string, forgeBlockId: string, oldClass: string, newClass: string): string {
  const forgeAttr = `data-forge-block-id="${forgeBlockId}"`;
  const attrIdx = code.indexOf(forgeAttr);
  if (attrIdx !== -1) {
    // Walk back to the start of the opening tag
    let tagStart = attrIdx;
    while (tagStart > 0 && code[tagStart] !== '<') tagStart--;

    // Walk forward to the closing '>' of the opening tag (respects quoted values)
    let pos = attrIdx + forgeAttr.length;
    let inQ = false;
    let qCh = '';
    while (pos < code.length) {
      const ch = code[pos];
      if (inQ) {
        if (ch === qCh) inQ = false;
      } else if (ch === '"' || ch === "'") {
        inQ = true;
        qCh = ch;
      } else if (ch === '>') break;
      pos++;
    }
    const tag = code.slice(tagStart, pos + 1);
    const esc = escapeRegex(oldClass);
    const patchedTag = tag
      .replace(new RegExp(`(className\\s*=\\s*")${esc}(")`, 'g'), `$1${newClass}$2`)
      .replace(new RegExp(`(className\\s*=\\s*')${esc}(')`, 'g'), `$1${newClass}$2`)
      .replace(new RegExp(`(className\\s*=\\s*\\{'")${esc}("'\\})`, 'g'), `$1${newClass}$2`);
    if (patchedTag !== tag) {
      return code.slice(0, tagStart) + patchedTag + code.slice(pos + 1);
    }
    // className not found on the root element — element is a child inside the block.
    // Scope the search to the forge block range (still better than global).
    const startMarker = `{/* forge-block-start:${forgeBlockId} */}`;
    const endMarker = `{/* forge-block-end:${forgeBlockId} */}`;
    const startIdx = code.indexOf(startMarker);
    const endIdx = code.indexOf(endMarker, startIdx);
    if (startIdx !== -1 && endIdx !== -1) {
      const blockEnd = endIdx + endMarker.length;
      const blockSource = code.slice(startIdx, blockEnd);
      const patchedBlock = patchCode(blockSource, oldClass, newClass);
      if (patchedBlock !== blockSource) return code.slice(0, startIdx) + patchedBlock + code.slice(blockEnd);
    }
  }
  return patchCode(code, oldClass, newClass);
}

function patchInlineStyle(code: string, oldStyle: string, newStyle: string): string {
  // Pattern 1: style="old"
  const esc = escapeRegex(oldStyle);
  const patched1 = code.replace(new RegExp(`style="${esc}"`, 'g'), `style="${newStyle}"`);
  if (patched1 !== code) return patched1;

  // Pattern 2: style={{ ... }} — replace the whole JSX object
  const jsxObj = toJSXStyleObject(newStyle);
  const patched2 = code.replace(/style=\{\{[^}]*\}\}/g, `style={${jsxObj}}`);
  return patched2;
}

const DEBOUNCE_MS = 500;

export function useStylePatcher() {
  const { sandpack } = useSandpack();
  const store = useStore();
  const setFiles = useSetAtom(filesAtom);
  // filesRef is updated directly on each patch — no atom subscription to avoid re-renders
  const filesRef = useRef(store.get(filesAtom));
  const pendingRef = useRef<Map<string, string>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync filesRef when atom changes from external sources (AI code gen, file save, etc.)
  useEffect(() => {
    return store.sub(filesAtom, () => {
      filesRef.current = store.get(filesAtom);
    });
  }, [store]);

  const sandpackRef = useRef(sandpack);
  useEffect(() => {
    sandpackRef.current = sandpack;
  }, [sandpack]);

  const flushToSandpack = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const entries = [...pendingRef.current.entries()];
      pendingRef.current.clear();
      if (entries.length === 0) return;
      for (const [path, code] of entries) sandpackRef.current.updateFile(path, code);
      setFiles((prev) => {
        const next = { ...prev };
        for (const [path, code] of entries) next[path] = code;
        return next;
      });
    }, DEBOUNCE_MS);
  }, [setFiles]);

  const commitUpdates = useCallback(
    (updates: Array<[string, string]>) => {
      const next = { ...filesRef.current };
      for (const [path, patched] of updates) {
        next[path] = patched;
        pendingRef.current.set(path, patched);
      }
      filesRef.current = next;
      flushToSandpack();
    },
    [flushToSandpack],
  );

  const applyClassChange = useCallback(
    (oldClassName: string, newClassName: string) => {
      const forgeBlockId = store.get(selectedElementAtom)?.forgeBlockId ?? '';
      const updates: Array<[string, string]> = [];
      for (const [path, code] of Object.entries(filesRef.current)) {
        const patched =
          forgeBlockId ?
            patchClassNameForElement(code, forgeBlockId, oldClassName, newClassName)
          : patchCode(code, oldClassName, newClassName);
        if (patched !== code) updates.push([path, patched]);
      }
      if (updates.length > 0) commitUpdates(updates);
    },
    [store, commitUpdates],
  );

  const applyInlineStyleChange = useCallback(
    (oldStyle: string, newStyle: string) => {
      if (oldStyle === newStyle) return;
      const updates: Array<[string, string]> = [];
      for (const [path, code] of Object.entries(filesRef.current)) {
        const patched = patchInlineStyle(code, oldStyle, newStyle);
        if (patched !== code) updates.push([path, patched]);
      }
      if (updates.length > 0) commitUpdates(updates);
    },
    [commitUpdates],
  );

  return { applyClassChange, applyInlineStyleChange };
}

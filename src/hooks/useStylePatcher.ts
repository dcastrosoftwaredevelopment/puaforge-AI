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
  const jsxObj = toJSXStyleObject(newStyle);

  // Pattern 1: style="old" (HTML string format — convert to JSX object)
  if (oldStyle) {
    const esc = escapeRegex(oldStyle);
    const patched1 = code.replace(new RegExp(`style="${esc}"`, 'g'), `style={${jsxObj}}`);
    if (patched1 !== code) return patched1;
  }

  // Pattern 2: style={{ ... }} — replace the whole JSX object.
  // Only safe when oldStyle is known; without it we cannot identify which element
  // to target and a global replace would corrupt unrelated style blocks.
  if (!oldStyle) return code;
  const patched2 = code.replace(/style=\{\{[\s\S]*?\}\}/g, `style={${jsxObj}}`);
  return patched2;
}

/**
 * Finds an element within `code` by its exact `className` value and applies the same
 * inline style patch logic as `patchInlineStyleForElement`. Used when a child element
 * (no own data-forge-block-id) is selected and needs its own style modified.
 */
function patchInlineStyleByClassName(code: string, className: string, oldStyle: string, newStyle: string): string {
  if (!className) return code;

  const classAttr1 = `className="${className}"`;
  const classAttr2 = `className={'${className}'}`;
  let anchorIdx = code.indexOf(classAttr1);
  let anchorLen = classAttr1.length;
  if (anchorIdx === -1) {
    anchorIdx = code.indexOf(classAttr2);
    anchorLen = classAttr2.length;
  }
  if (anchorIdx === -1) return code;

  let tagStart = anchorIdx;
  while (tagStart > 0 && code[tagStart] !== '<') tagStart--;

  let pos = anchorIdx + anchorLen;
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
  const jsxObj = toJSXStyleObject(newStyle);
  let patchedTag: string;

  if (!newStyle) {
    patchedTag = tag.replace(/\s+style="[^]*?"(?=\s|\/?>)/, '').replace(/\s+style=\{\{[\s\S]*?\}\}/, '');
  } else if (tag.match(/style=\{\{[\s\S]*?\}\}/)) {
    patchedTag = tag.replace(/style=\{\{[\s\S]*?\}\}/, `style={${jsxObj}}`);
  } else if (tag.includes('style="')) {
    patchedTag = tag.replace(/style="[^]*?"(?=\s|\/?>)/, `style={${jsxObj}}`);
  } else {
    patchedTag =
      tag.endsWith('/>') ? tag.slice(0, -2) + ` style={${jsxObj}} />` : tag.slice(0, -1) + ` style={${jsxObj}}>`;
  }

  if (patchedTag === tag) return code;
  return code.slice(0, tagStart) + patchedTag + code.slice(pos + 1);
}

/**
 * Inline style patch for a child element (no own data-forge-block-id).
 * Scopes the className search to the forge block range when markers are available,
 * then falls back to a full-file search by className, then to the global patcher.
 */
function patchInlineStyleForChild(
  code: string,
  forgeBlockId: string,
  className: string,
  oldStyle: string,
  newStyle: string,
): string {
  const startMarker = `{/* forge-block-start:${forgeBlockId} */}`;
  const endMarker = `{/* forge-block-end:${forgeBlockId} */}`;
  const startIdx = code.indexOf(startMarker);
  const endIdx = code.indexOf(endMarker, startIdx);

  if (startIdx !== -1 && endIdx !== -1 && className) {
    const blockEnd = endIdx + endMarker.length;
    const blockSource = code.slice(startIdx, blockEnd);
    const patchedBlock = patchInlineStyleByClassName(blockSource, className, oldStyle, newStyle);
    if (patchedBlock !== blockSource) return code.slice(0, startIdx) + patchedBlock + code.slice(blockEnd);
  }

  if (className) {
    const patched = patchInlineStyleByClassName(code, className, oldStyle, newStyle);
    if (patched !== code) return patched;
  }

  return patchInlineStyle(code, oldStyle, newStyle);
}

function patchInlineStyleForElement(code: string, forgeBlockId: string, oldStyle: string, newStyle: string): string {
  const forgeAttr = `data-forge-block-id="${forgeBlockId}"`;
  const attrIdx = code.indexOf(forgeAttr);
  if (attrIdx === -1) return patchInlineStyle(code, oldStyle, newStyle);

  // Walk back to find '<' (start of opening tag)
  let tagStart = attrIdx;
  while (tagStart > 0 && code[tagStart] !== '<') tagStart--;

  // Walk forward to find '>' (end of opening tag, quote-aware)
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
  let patchedTag: string;
  const jsxObj = toJSXStyleObject(newStyle);

  if (!newStyle) {
    // Remove style attribute entirely
    patchedTag = tag.replace(/\s+style="[^]*?"(?=\s|\/?>)/, '').replace(/\s+style=\{\{[\s\S]*?\}\}/, '');
  } else if (tag.match(/style=\{\{[\s\S]*?\}\}/)) {
    // Replace existing JSX object attr — match both brace pairs {{ ... }}
    patchedTag = tag.replace(/style=\{\{[\s\S]*?\}\}/, `style={${jsxObj}}`);
  } else if (tag.includes('style="')) {
    // Replace and convert to JSX object
    patchedTag = tag.replace(/style="[^]*?"(?=\s|\/?>)/, `style={${jsxObj}}`);
  } else {
    // No style attr yet — inject JSX object before closing > or />
    patchedTag =
      tag.endsWith('/>') ? tag.slice(0, -2) + ` style={${jsxObj}} />` : tag.slice(0, -1) + ` style={${jsxObj}}>`;
  }

  if (patchedTag === tag) return code;
  return code.slice(0, tagStart) + patchedTag + code.slice(pos + 1);
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
      const el = store.get(selectedElementAtom);
      const forgeBlockId = el?.forgeBlockId ?? '';
      const isBlockRoot = el?.isBlockRoot ?? false;
      const className = el?.className ?? '';
      const updates: Array<[string, string]> = [];
      for (const [path, code] of Object.entries(filesRef.current)) {
        let patched: string;
        if (forgeBlockId && isBlockRoot) {
          patched = patchInlineStyleForElement(code, forgeBlockId, oldStyle, newStyle);
        } else if (forgeBlockId && !isBlockRoot) {
          patched = patchInlineStyleForChild(code, forgeBlockId, className, oldStyle, newStyle);
        } else {
          patched = patchInlineStyle(code, oldStyle, newStyle);
        }
        if (patched !== code) updates.push([path, patched]);
      }
      if (updates.length > 0) commitUpdates(updates);
    },
    [store, commitUpdates],
  );

  return { applyClassChange, applyInlineStyleChange };
}

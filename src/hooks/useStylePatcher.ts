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
  return code;
}

/**
 * Finds an element within `code` by its exact `className` value and applies the same
 * inline style patch logic as `patchInlineStyleForElement`. Used when a child element
 * (no own data-forge-block-id) is selected and needs its own style modified.
 */
function patchInlineStyleByClassName(code: string, className: string, newStyle: string): string {
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
function patchInlineStyleForChild(code: string, forgeBlockId: string, className: string, newStyle: string): string {
  const startMarker = `{/* forge-block-start:${forgeBlockId} */}`;
  const endMarker = `{/* forge-block-end:${forgeBlockId} */}`;
  const startIdx = code.indexOf(startMarker);
  const endIdx = code.indexOf(endMarker, startIdx);

  if (startIdx !== -1 && endIdx !== -1 && className) {
    const blockEnd = endIdx + endMarker.length;
    const blockSource = code.slice(startIdx, blockEnd);
    const patchedBlock = patchInlineStyleByClassName(blockSource, className, newStyle);
    if (patchedBlock !== blockSource) return code.slice(0, startIdx) + patchedBlock + code.slice(blockEnd);
  }

  if (className) {
    const patched = patchInlineStyleByClassName(code, className, newStyle);
    if (patched !== code) return patched;
  }

  return code;
}

function patchInlineStyleForElement(code: string, forgeBlockId: string, newStyle: string): string {
  const forgeAttr = `data-forge-block-id="${forgeBlockId}"`;
  const attrIdx = code.indexOf(forgeAttr);
  if (attrIdx === -1) return code;

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

/**
 * Patches className on the exact element identified by its data-forge-id in source.
 * Because the element is already located by data-forge-id, oldClass is not needed —
 * we replace whatever className value is there, or inject one if absent.
 * Returns the unmodified code when the forge-id is not found (caller handles fallback).
 */
function patchClassNameByForgeId(code: string, forgeId: string, _oldClass: string, newClass: string): string {
  const anchor = `data-forge-id="${forgeId}"`;
  const anchorIdx = code.indexOf(anchor);
  if (anchorIdx === -1) return code;

  let tagStart = anchorIdx;
  while (tagStart > 0 && code[tagStart] !== '<') tagStart--;

  let pos = anchorIdx + anchor.length;
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

  // Element found — replace or inject className without relying on oldClass
  let patchedTag: string;
  if (!newClass) {
    // Remove className attribute entirely
    patchedTag = tag
      .replace(/\s+className\s*=\s*"[^"]*"/, '')
      .replace(/\s+className\s*=\s*'[^']*'/, '')
      .replace(/\s+className\s*=\s*\{['"][^'"]*['"]\}/, '');
  } else if (/className\s*=/.test(tag)) {
    // Replace existing className value
    patchedTag = tag
      .replace(/(className\s*=\s*")[^"]*(")/g, `$1${newClass}$2`)
      .replace(/(className\s*=\s*')[^']*(')/g, `$1${newClass}$2`)
      .replace(/(className\s*=\s*\{')[^']*('\})/g, `$1${newClass}$2`);
  } else {
    // No className yet — inject it before the closing > or />
    patchedTag =
      tag.endsWith('/>') ?
        tag.slice(0, -2) + ` className="${newClass}" />`
      : tag.slice(0, -1) + ` className="${newClass}">`;
  }

  if (patchedTag === tag) return code;
  return code.slice(0, tagStart) + patchedTag + code.slice(pos + 1);
}

/**
 * Patches inline style on the exact element identified by its data-forge-id in source.
 * Returns the unmodified code when the forge-id is not found (caller handles fallback).
 */
function patchInlineStyleByForgeId(code: string, forgeId: string, _oldStyle: string, newStyle: string): string {
  const anchor = `data-forge-id="${forgeId}"`;
  const anchorIdx = code.indexOf(anchor);
  if (anchorIdx === -1) return code;

  let tagStart = anchorIdx;
  while (tagStart > 0 && code[tagStart] !== '<') tagStart--;

  let pos = anchorIdx + anchor.length;
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

function findMatchingClosingTag(
  code: string,
  tagLower: string,
  searchFrom: number,
): { start: number; end: number } | null {
  let depth = 1;
  let pos = searchFrom;
  const openTag = `<${tagLower}`;
  const closeTag = `</${tagLower}`;

  while (pos < code.length && depth > 0) {
    const nextOpen = code.indexOf(openTag, pos);
    const nextClose = code.indexOf(closeTag, pos);
    if (nextClose === -1) return null;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      const afterTag = code[nextOpen + openTag.length] ?? '';
      if (/[\s/>]/.test(afterTag)) depth++;
      pos = nextOpen + openTag.length;
    } else {
      depth--;
      if (depth === 0) {
        let end = nextClose + closeTag.length;
        while (end < code.length && code[end] !== '>') end++;
        return { start: nextClose, end: end + 1 };
      }
      pos = nextClose + closeTag.length;
    }
  }
  return null;
}

/**
 * Injects `data-forge-id` + `data-forge-block-id` attributes into an element's opening
 * tag and wraps it with forge-block-start/end markers. Uses a cascade of search strategies
 * to locate the element even when it has no className or shares classes with other elements.
 */
function injectForgeBlockId(
  code: string,
  tagName: string,
  id: string,
  forgeId: string,
  opts: {
    className?: string;
    parentForgeBlockId?: string;
    attributes?: Record<string, string>;
    textContent?: string;
  },
): { patched: string; injected: boolean } {
  if (!tagName) return { patched: code, injected: false };
  const tagLower = tagName.toLowerCase();

  // Walk back from anchorIdx to find '<' and verify the tag matches tagLower.
  function findTagStart(anchorIdx: number): number {
    let ts = anchorIdx;
    while (ts > 0 && code[ts] !== '<') ts--;
    const slice = code.slice(ts + 1);
    if (!slice.startsWith(tagLower) || /[a-z0-9]/i.test(slice[tagLower.length] ?? '')) return -1;
    return ts;
  }

  let tagStart = -1;
  let alreadyHasForgeId = false;

  // Strategy 0: data-forge-id already in source — use as direct anchor (avoids re-scanning)
  if (tagStart === -1) {
    const s0 = code.indexOf(`data-forge-id="${forgeId}"`);
    if (s0 !== -1) {
      const ts = findTagStart(s0);
      if (ts !== -1) {
        tagStart = ts;
        alreadyHasForgeId = true;
      }
    }
  }

  // Strategy 1: className scoped to parent forge block (precise when class is non-unique)
  if (tagStart === -1 && opts.className && opts.parentForgeBlockId) {
    const sm = `{/* forge-block-start:${opts.parentForgeBlockId} */}`;
    const em = `{/* forge-block-end:${opts.parentForgeBlockId} */}`;
    const bs = code.indexOf(sm);
    const be = bs !== -1 ? code.indexOf(em, bs) : -1;
    if (bs !== -1 && be !== -1) {
      const scope = code.slice(bs, be);
      let ai = scope.indexOf(`className="${opts.className}"`);
      if (ai === -1) ai = scope.indexOf(`className={'${opts.className}'}`);
      if (ai !== -1) {
        const ts = findTagStart(bs + ai);
        if (ts !== -1) tagStart = ts;
      }
    }
  }

  // Strategy 2: className global
  if (tagStart === -1 && opts.className) {
    let ai = code.indexOf(`className="${opts.className}"`);
    if (ai === -1) ai = code.indexOf(`className={'${opts.className}'}`);
    if (ai !== -1) {
      const ts = findTagStart(ai);
      if (ts !== -1) tagStart = ts;
    }
  }

  // Strategy 3: id attribute
  if (tagStart === -1 && opts.attributes?.id) {
    const ai = code.indexOf(`id="${opts.attributes.id}"`);
    if (ai !== -1) {
      const ts = findTagStart(ai);
      if (ts !== -1) tagStart = ts;
    }
  }

  // Strategy 4: other unique HTML attributes
  if (tagStart === -1 && opts.attributes) {
    for (const attr of ['href', 'src', 'alt', 'placeholder', 'type', 'name'] as const) {
      const val = opts.attributes[attr];
      if (!val) continue;
      const ai = code.indexOf(`${attr}="${val}"`);
      if (ai === -1) continue;
      const ts = findTagStart(ai);
      if (ts !== -1) {
        tagStart = ts;
        break;
      }
    }
  }

  // Strategy 5: textContent (for leaf text elements with no class or attributes)
  if (tagStart === -1 && opts.textContent) {
    const textEsc = escapeRegex(opts.textContent);
    const re = new RegExp(`<${tagLower}(\\s[^>]*)?>\\s*${textEsc}\\s*<\\/${tagLower}\\s*>`);
    const m = re.exec(code);
    if (m) tagStart = m.index;
  }

  if (tagStart === -1) return { patched: code, injected: false };

  // Find end of opening tag (quote-aware)
  let pos = tagStart + 1 + tagLower.length;
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
  const openingTagEnd = pos;
  const isSelfClosing = code[pos - 1] === '/';

  // Indentation of the line containing the opening tag
  let lineStart = tagStart;
  while (lineStart > 0 && code[lineStart - 1] !== '\n') lineStart--;
  const indent = code.slice(lineStart, tagStart).match(/^(\s*)/)?.[1] ?? '';

  // Inject data-forge-id (unless already present) + data-forge-block-id after tagName
  const insertAttrAt = tagStart + 1 + tagLower.length;
  const attrInjection =
    alreadyHasForgeId ? ` data-forge-block-id="${id}"` : ` data-forge-id="${forgeId}" data-forge-block-id="${id}"`;
  let result = code.slice(0, insertAttrAt) + attrInjection + code.slice(insertAttrAt);
  const shift = attrInjection.length;
  const adjustedOpeningTagEnd = openingTagEnd + shift;

  const startMarker = `{/* forge-block-start:${id} */}\n${indent}`;
  const endMarker = `\n${indent}{/* forge-block-end:${id} */}`;

  if (isSelfClosing) {
    const after = adjustedOpeningTagEnd + 1;
    result = result.slice(0, tagStart) + startMarker + result.slice(tagStart, after) + endMarker + result.slice(after);
    return { patched: result, injected: true };
  }

  const closing = findMatchingClosingTag(result, tagLower, adjustedOpeningTagEnd + 1);
  if (!closing) {
    // Could not find matching closing tag — return with just the attributes injected
    return { patched: result, injected: true };
  }

  // Insert end marker first (higher index), then start marker (avoids position shift)
  result = result.slice(0, closing.end) + endMarker + result.slice(closing.end);
  result = result.slice(0, tagStart) + startMarker + result.slice(tagStart);

  return { patched: result, injected: true };
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

  // Sync filesRef when atom changes from external sources (AI code gen, file save, etc.).
  // Re-apply any pending (not-yet-flushed) patches on top so they are not lost when an
  // unrelated setFiles call (e.g. updating /__forge_global.css) resets filesAtom.
  useEffect(() => {
    return store.sub(filesAtom, () => {
      const next = store.get(filesAtom);
      if (pendingRef.current.size > 0) {
        filesRef.current = { ...next, ...Object.fromEntries(pendingRef.current) };
      } else {
        filesRef.current = next;
      }
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

  // Auto-inject data-forge-block-id for selected elements that have none.
  // tryInject runs on mount (handles elements selected before StyleEditor was open)
  // AND on every atom change (handles new selections while StyleEditor is open).
  useEffect(() => {
    let lastProcessedId = '';

    const tryInject = () => {
      const el = store.get(selectedElementAtom);
      if (!el) return;
      if (el.id === lastProcessedId) return;
      if (el.isBlockRoot || !el.tagName) {
        lastProcessedId = el.id;
        return;
      }

      const newId = `block-${el.tagName.toLowerCase()}-${Date.now()}`;
      const updates: Array<[string, string]> = [];
      for (const [path, code] of Object.entries(filesRef.current)) {
        if (!path.endsWith('.tsx') && !path.endsWith('.jsx')) continue;
        const { patched, injected } = injectForgeBlockId(code, el.tagName, newId, el.id, {
          className: el.className || undefined,
          parentForgeBlockId: el.forgeBlockId || undefined,
          attributes: el.attributes,
          textContent: el.textContent,
        });
        if (injected) updates.push([path, patched]);
      }
      if (updates.length > 0) {
        commitUpdates(updates);
        store.set(selectedElementAtom, { ...el, forgeBlockId: newId, isBlockRoot: true });
        lastProcessedId = el.id;
      }
      // If injection failed, don't set lastProcessedId — allow retry on re-selection
    };

    tryInject();
    const unsub = store.sub(selectedElementAtom, tryInject);
    // Retry when files change — covers the case where the element was selected before
    // the 800ms auto-sync poll fired (filesRef was stale at injection time).
    const unsubFiles = store.sub(filesAtom, () => {
      const el = store.get(selectedElementAtom);
      if (el && !el.forgeBlockId && el.id !== lastProcessedId) tryInject();
    });
    return () => {
      unsub();
      unsubFiles();
    };
  }, [store, commitUpdates]);

  const applyClassChange = useCallback(
    (oldClassName: string, newClassName: string) => {
      const el = store.get(selectedElementAtom);
      const forgeId = el?.id ?? '';
      const forgeBlockId = el?.forgeBlockId ?? '';
      const updates: Array<[string, string]> = [];
      for (const [path, code] of Object.entries(filesRef.current)) {
        // Primary: patch by data-forge-id (unique, written to source during injection)
        let patched = forgeId ? patchClassNameByForgeId(code, forgeId, oldClassName, newClassName) : code;
        // Fallback: patch by data-forge-block-id (catalog blocks not yet reached by forge-id)
        if (patched === code && forgeBlockId)
          patched = patchClassNameForElement(code, forgeBlockId, oldClassName, newClassName);
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
      const forgeId = el?.id ?? '';
      const forgeBlockId = el?.forgeBlockId ?? '';
      const isBlockRoot = el?.isBlockRoot ?? false;
      const className = el?.className ?? '';
      const updates: Array<[string, string]> = [];
      for (const [path, code] of Object.entries(filesRef.current)) {
        // Primary: patch by data-forge-id (unique, written to source during injection)
        let patched = forgeId ? patchInlineStyleByForgeId(code, forgeId, oldStyle, newStyle) : code;
        if (patched === code) {
          // Fallback: block-id based patchers (catalog blocks / pre-injection state)
          if (forgeBlockId && isBlockRoot) {
            patched = patchInlineStyleForElement(code, forgeBlockId, newStyle);
          } else if (forgeBlockId && !isBlockRoot) {
            patched = patchInlineStyleForChild(code, forgeBlockId, className, newStyle);
          } else {
            patched = code;
          }
        }
        if (patched !== code) updates.push([path, patched]);
      }
      if (updates.length > 0) commitUpdates(updates);
    },
    [store, commitUpdates],
  );

  return { applyClassChange, applyInlineStyleChange };
}

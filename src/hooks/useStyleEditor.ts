import { useCallback, useContext, useEffect, useRef } from 'react';
import { useStore, useSetAtom } from 'jotai';
import { selectedElementAtom, styleBreakpointAtom, PREFIX_MAP } from '@/atoms';
import { replaceClassWithPrefix, removeClassCategoryWithPrefix, removeClass, addClass } from '@/utils/tailwindClasses';
import { parseInlineStyle, toInlineCss } from '@/utils/inlineStyles';
import { StylePatcherContext } from './useStylePatcher';

export function useStyleEditor() {
  const store = useStore();
  const setSelectedElement = useSetAtom(selectedElementAtom);
  const { applyClassChange, applyInlineStyleChange } = useContext(StylePatcherContext);

  // Live refs — updated via store.sub, never cause re-renders
  const liveClassNameRef = useRef(store.get(selectedElementAtom)?.className ?? '');
  const liveInlineStyleRef = useRef(store.get(selectedElementAtom)?.inlineStyle ?? '');

  useEffect(() => {
    let prevId = store.get(selectedElementAtom)?.id;
    const unsubEl = store.sub(selectedElementAtom, () => {
      const el = store.get(selectedElementAtom);
      if (el?.id !== prevId) {
        // Different element selected: reset refs to the incoming element's values
        liveClassNameRef.current = el?.className ?? '';
        liveInlineStyleRef.current = el?.inlineStyle ?? '';
        prevId = el?.id;
      }
      // Same element (e.g. rect-only update from ResizeObserver): don't overwrite live refs
    });
    const unsubBp = store.sub(styleBreakpointAtom, () => {
      liveClassNameRef.current = store.get(selectedElementAtom)?.className ?? '';
    });
    return () => {
      unsubEl();
      unsubBp();
    };
  }, [store]);

  // ── debounce per field ────────────────────────────────────────────────────

  const pendingRef = useRef<Map<string, { timer: ReturnType<typeof setTimeout>; fn: () => void }>>(new Map());

  const withDebounce = useCallback((key: string, fn: () => void, delay = 500) => {
    const existing = pendingRef.current.get(key);
    if (existing) clearTimeout(existing.timer);
    pendingRef.current.set(key, {
      fn,
      timer: setTimeout(() => {
        fn();
        pendingRef.current.delete(key);
      }, delay),
    });
  }, []);

  const flushDebounce = useCallback((key: string) => {
    const pending = pendingRef.current.get(key);
    if (!pending) return;
    clearTimeout(pending.timer);
    pending.fn();
    pendingRef.current.delete(key);
  }, []);

  // ── immediate helpers (selects/buttons) ──────────────────────────────────

  const apply = useCallback(
    (newClassName: string) => {
      if (!store.get(selectedElementAtom)) return;
      applyClassChange(liveClassNameRef.current, newClassName);
      liveClassNameRef.current = newClassName;
      setSelectedElement((prev) => (prev ? { ...prev, className: newClassName } : null));
    },
    [store, applyClassChange, setSelectedElement],
  );

  const applyClass = useCallback(
    (newClass: string) => {
      if (!store.get(selectedElementAtom)) return;
      const prefix = PREFIX_MAP[store.get(styleBreakpointAtom)];
      apply(replaceClassWithPrefix(liveClassNameRef.current, newClass, prefix));
    },
    [store, apply],
  );

  const removeOneClass = useCallback(
    (cls: string) => {
      if (!store.get(selectedElementAtom)) return;
      apply(removeClass(liveClassNameRef.current, cls));
    },
    [store, apply],
  );

  const addOneClass = useCallback(
    (cls: string) => {
      if (!store.get(selectedElementAtom)) return;
      apply(addClass(liveClassNameRef.current, cls));
    },
    [store, apply],
  );

  const removeCategory = useCallback(
    (representative: string) => {
      if (!store.get(selectedElementAtom)) return;
      const prefix = PREFIX_MAP[store.get(styleBreakpointAtom)];
      apply(removeClassCategoryWithPrefix(liveClassNameRef.current, representative, prefix));
    },
    [store, apply],
  );

  // ── live className helpers (no atom update → no re-render) ───────────────

  const applyLiveClass = useCallback(
    (newClass: string) => {
      if (!store.get(selectedElementAtom)) return;
      const prefix = PREFIX_MAP[store.get(styleBreakpointAtom)];
      const newClassName = replaceClassWithPrefix(liveClassNameRef.current, newClass, prefix);
      applyClassChange(liveClassNameRef.current, newClassName);
      liveClassNameRef.current = newClassName;
    },
    [store, applyClassChange],
  );

  const removeLiveCategory = useCallback(
    (representative: string) => {
      if (!store.get(selectedElementAtom)) return;
      const prefix = PREFIX_MAP[store.get(styleBreakpointAtom)];
      const newClassName = removeClassCategoryWithPrefix(liveClassNameRef.current, representative, prefix);
      applyClassChange(liveClassNameRef.current, newClassName);
      liveClassNameRef.current = newClassName;
    },
    [store, applyClassChange],
  );

  const commitClassName = useCallback(() => {
    if (!store.get(selectedElementAtom)) return;
    setSelectedElement((prev) => (prev ? { ...prev, className: liveClassNameRef.current } : null));
  }, [store, setSelectedElement]);

  // ── live inline style helpers (no atom update → no re-render) ───────────

  const applyLiveInlineProp = useCallback(
    (prop: string, value: string) => {
      if (!store.get(selectedElementAtom)) return;
      const current = parseInlineStyle(liveInlineStyleRef.current);
      const updated =
        value ?
          { ...current, [prop]: value }
        : (() => {
            const c = { ...current };
            delete c[prop];
            return c;
          })();
      const newStyle = toInlineCss(updated);
      applyInlineStyleChange(liveInlineStyleRef.current, newStyle);
      liveInlineStyleRef.current = newStyle;
    },
    [store, applyInlineStyleChange],
  );

  const commitInlineStyle = useCallback(() => {
    if (!store.get(selectedElementAtom)) return;
    setSelectedElement((prev) => (prev ? { ...prev, inlineStyle: liveInlineStyleRef.current } : null));
  }, [store, setSelectedElement]);

  // ── immediate inline style helpers ───────────────────────────────────────

  const applyInlineStyle = useCallback(
    (updated: Record<string, string>) => {
      const el = store.get(selectedElementAtom);
      if (!el) return;
      const newStyle = toInlineCss(updated);
      applyInlineStyleChange(el.inlineStyle ?? '', newStyle);
      liveInlineStyleRef.current = newStyle;
      setSelectedElement((prev) => (prev ? { ...prev, inlineStyle: newStyle } : null));
    },
    [store, applyInlineStyleChange, setSelectedElement],
  );

  const removeInlineProp = useCallback(
    (key: string) => {
      const current = parseInlineStyle(liveInlineStyleRef.current);
      const updated = { ...current };
      delete updated[key];
      applyInlineStyle(updated);
    },
    [applyInlineStyle],
  );

  const addInlineProp = useCallback(
    (key: string, value: string) => {
      if (!key.trim()) return;
      const current = parseInlineStyle(liveInlineStyleRef.current);
      applyInlineStyle({ ...current, [key.trim()]: value.trim() });
    },
    [applyInlineStyle],
  );

  return {
    applyClass,
    removeOneClass,
    addOneClass,
    removeCategory,
    removeInlineProp,
    addInlineProp,
    withDebounce,
    flushDebounce,
    applyLiveClass,
    removeLiveCategory,
    commitClassName,
    applyLiveInlineProp,
    commitInlineStyle,
  };
}

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useAtom } from 'jotai'
import { selectedElementAtom } from '@/atoms'
import { parseClassesByBreakpoint, replaceClassWithPrefix, removeClassCategoryWithPrefix, removeClass, addClass } from '@/utils/tailwindClasses'
import { parseInlineStyle, toInlineCss } from '@/utils/inlineStyles'
import { useStylePatcher } from './useStylePatcher'
import { useStyleBreakpoint } from './useStyleBreakpoint'

export function useStyleEditor() {
  const [selectedElement, setSelectedElement] = useAtom(selectedElementAtom)
  const { applyClassChange, applyInlineStyleChange } = useStylePatcher()
  const { prefix } = useStyleBreakpoint()

  const parsed = useMemo(
    () => parseClassesByBreakpoint(selectedElement?.className ?? '', prefix),
    [selectedElement, prefix],
  )

  const parsedInlineStyle = useMemo(
    () => (selectedElement?.inlineStyle ? parseInlineStyle(selectedElement.inlineStyle) : {}),
    [selectedElement],
  )

  // Live refs track in-progress edits without triggering re-renders.
  // Synced from atom only when the selected element changes (not on every keystroke).
  const liveClassNameRef = useRef(selectedElement?.className ?? '')
  const liveInlineStyleRef = useRef(selectedElement?.inlineStyle ?? '')

  useEffect(() => {
    liveClassNameRef.current = selectedElement?.className ?? ''
    liveInlineStyleRef.current = selectedElement?.inlineStyle ?? ''
  }, [selectedElement?.id, prefix])

  // ── debounce per field ────────────────────────────────────────────────────

  const pendingRef = useRef<Map<string, { timer: ReturnType<typeof setTimeout>; fn: () => void }>>(new Map())

  const withDebounce = useCallback((key: string, fn: () => void, delay = 300) => {
    const existing = pendingRef.current.get(key)
    if (existing) clearTimeout(existing.timer)
    pendingRef.current.set(key, {
      fn,
      timer: setTimeout(() => { fn(); pendingRef.current.delete(key) }, delay),
    })
  }, [])

  const flushDebounce = useCallback((key: string) => {
    const pending = pendingRef.current.get(key)
    if (!pending) return
    clearTimeout(pending.timer)
    pending.fn()
    pendingRef.current.delete(key)
  }, [])

  // ── live className helpers (no atom update → no re-render) ───────────────

  const applyLiveClass = useCallback((newClass: string) => {
    if (!selectedElement) return
    const newClassName = replaceClassWithPrefix(liveClassNameRef.current, newClass, prefix)
    applyClassChange(liveClassNameRef.current, newClassName)
    liveClassNameRef.current = newClassName
  }, [selectedElement, applyClassChange, prefix])

  const removeLiveCategory = useCallback((representative: string) => {
    if (!selectedElement) return
    const newClassName = removeClassCategoryWithPrefix(liveClassNameRef.current, representative, prefix)
    applyClassChange(liveClassNameRef.current, newClassName)
    liveClassNameRef.current = newClassName
  }, [selectedElement, applyClassChange, prefix])

  const commitClassName = useCallback(() => {
    if (!selectedElement) return
    setSelectedElement((prev) => prev ? { ...prev, className: liveClassNameRef.current } : null)
  }, [selectedElement, setSelectedElement])

  // ── live inline style helpers (no atom update → no re-render) ───────────

  const applyLiveInlineProp = useCallback((prop: string, value: string) => {
    if (!selectedElement) return
    const current = parseInlineStyle(liveInlineStyleRef.current)
    const updated = value ? { ...current, [prop]: value } : (() => { const c = { ...current }; delete c[prop]; return c })()
    const newStyle = toInlineCss(updated)
    applyInlineStyleChange(liveInlineStyleRef.current, newStyle)
    liveInlineStyleRef.current = newStyle
  }, [selectedElement, applyInlineStyleChange])

  const commitInlineStyle = useCallback(() => {
    if (!selectedElement) return
    setSelectedElement((prev) => prev ? { ...prev, inlineStyle: liveInlineStyleRef.current } : null)
  }, [selectedElement, setSelectedElement])

  // ── immediate helpers (for selects, buttons — instant feedback needed) ───

  const apply = useCallback((newClassName: string) => {
    if (!selectedElement) return
    applyClassChange(selectedElement.className, newClassName)
    liveClassNameRef.current = newClassName
    setSelectedElement((prev) => (prev ? { ...prev, className: newClassName } : null))
  }, [selectedElement, applyClassChange, setSelectedElement])

  const applyClass = useCallback((newClass: string) => {
    if (!selectedElement) return
    apply(replaceClassWithPrefix(selectedElement.className, newClass, prefix))
  }, [selectedElement, apply, prefix])

  const removeOneClass = useCallback((cls: string) => {
    if (!selectedElement) return
    apply(removeClass(selectedElement.className, cls))
  }, [selectedElement, apply])

  const addOneClass = useCallback((cls: string) => {
    if (!selectedElement) return
    apply(addClass(selectedElement.className, cls))
  }, [selectedElement, apply])

  const removeCategory = useCallback((representative: string) => {
    if (!selectedElement) return
    apply(removeClassCategoryWithPrefix(selectedElement.className, representative, prefix))
  }, [selectedElement, apply, prefix])

  // ── inline style helpers (immediate, for add/remove buttons) ─────────────

  const applyInlineStyle = useCallback((updated: Record<string, string>) => {
    if (!selectedElement) return
    const newStyle = toInlineCss(updated)
    applyInlineStyleChange(selectedElement.inlineStyle ?? '', newStyle)
    liveInlineStyleRef.current = newStyle
    setSelectedElement((prev) => (prev ? { ...prev, inlineStyle: newStyle } : null))
  }, [selectedElement, applyInlineStyleChange, setSelectedElement])

  const setInlineProp = useCallback((key: string, value: string) => {
    applyInlineStyle({ ...parsedInlineStyle, [key]: value })
  }, [parsedInlineStyle, applyInlineStyle])

  const removeInlineProp = useCallback((key: string) => {
    const updated = { ...parsedInlineStyle }
    delete updated[key]
    applyInlineStyle(updated)
  }, [parsedInlineStyle, applyInlineStyle])

  const addInlineProp = useCallback((key: string, value: string) => {
    if (!key.trim()) return
    applyInlineStyle({ ...parsedInlineStyle, [key.trim()]: value.trim() })
  }, [parsedInlineStyle, applyInlineStyle])

  return {
    selectedElement,
    parsed,
    parsedInlineStyle,
    applyClass,
    removeOneClass,
    addOneClass,
    removeCategory,
    setInlineProp,
    removeInlineProp,
    addInlineProp,
    setSelectedElement,
    withDebounce,
    flushDebounce,
    applyLiveClass,
    removeLiveCategory,
    commitClassName,
    applyLiveInlineProp,
    commitInlineStyle,
  }
}

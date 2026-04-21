import { useCallback, useMemo, useRef } from 'react'
import { useAtom } from 'jotai'
import { selectedElementAtom } from '@/atoms'
import { parseClasses, replaceClass, removeClass, addClass, removeClassCategory } from '@/utils/tailwindClasses'
import { parseInlineStyle, toInlineCss } from '@/utils/inlineStyles'
import { useStylePatcher } from './useStylePatcher'

export function useStyleEditor() {
  const [selectedElement, setSelectedElement] = useAtom(selectedElementAtom)
  const { applyClassChange, applyInlineStyleChange } = useStylePatcher()

  const parsed = useMemo(
    () => parseClasses(selectedElement?.className ?? ''),
    [selectedElement],
  )

  const parsedInlineStyle = useMemo(
    () => (selectedElement?.inlineStyle ? parseInlineStyle(selectedElement.inlineStyle) : {}),
    [selectedElement?.inlineStyle],
  )

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

  // ── className helpers ─────────────────────────────────────────────────────

  const apply = useCallback((newClassName: string) => {
    if (!selectedElement) return
    applyClassChange(selectedElement.className, newClassName)
    setSelectedElement((prev) => (prev ? { ...prev, className: newClassName } : null))
  }, [selectedElement, applyClassChange, setSelectedElement])

  const applyClass = useCallback((newClass: string) => {
    if (!selectedElement) return
    apply(replaceClass(selectedElement.className, newClass))
  }, [selectedElement, apply])

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
    apply(removeClassCategory(selectedElement.className, representative))
  }, [selectedElement, apply])

  // ── inline style helpers ──────────────────────────────────────────────────

  const applyInlineStyle = useCallback((updated: Record<string, string>) => {
    if (!selectedElement) return
    const newStyle = toInlineCss(updated)
    applyInlineStyleChange(selectedElement.inlineStyle ?? '', newStyle)
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
  }
}

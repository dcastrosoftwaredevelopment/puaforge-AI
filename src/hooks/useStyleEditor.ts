import { useCallback, useMemo } from 'react'
import { useAtom } from 'jotai'
import { selectedElementAtom } from '@/atoms'
import { parseClasses, replaceClass, removeClass, addClass, removeClassCategory } from '@/utils/tailwindClasses'
import { useStylePatcher } from './useStylePatcher'

export function useStyleEditor() {
  const [selectedElement, setSelectedElement] = useAtom(selectedElementAtom)
  const { applyClassChange } = useStylePatcher()

  const parsed = useMemo(
    () => (selectedElement ? parseClasses(selectedElement.className) : null),
    [selectedElement],
  )

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

  return { selectedElement, parsed, applyClass, removeOneClass, addOneClass, removeCategory, setSelectedElement }
}

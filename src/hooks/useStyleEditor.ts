import { useCallback, useMemo } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { selectedElementAtom } from '@/atoms'
import { parseClasses, replaceClass, removeClass, addClass } from '@/utils/tailwindClasses'
import { useStylePatcher } from './useStylePatcher'

export function useStyleEditor() {
  const [selectedElement, setSelectedElement] = useAtom(selectedElementAtom)
  const { applyClassChange } = useStylePatcher()
  const setSelected = useSetAtom(selectedElementAtom)

  const parsed = useMemo(
    () => (selectedElement ? parseClasses(selectedElement.className) : null),
    [selectedElement],
  )

  const apply = useCallback((newClassName: string) => {
    if (!selectedElement) return
    applyClassChange(selectedElement.className, newClassName)
    setSelected((prev) => (prev ? { ...prev, className: newClassName } : null))
  }, [selectedElement, applyClassChange, setSelected])

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

  return {
    selectedElement,
    parsed,
    applyClass,
    removeOneClass,
    addOneClass,
    setSelectedElement,
  }
}

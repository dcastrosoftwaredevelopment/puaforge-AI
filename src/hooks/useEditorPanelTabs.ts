import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { editorPanelModeAtom, inspectModeAtom, selectedElementAtom, hoveredElementAtom } from '@/atoms'
import { useCallback } from 'react'
import type { EditorPanelMode } from '@/atoms'

export function useEditorPanelTabs() {
  const [editorPanelMode, setEditorPanelMode] = useAtom(editorPanelModeAtom)
  const [inspectMode, setInspectMode] = useAtom(inspectModeAtom)
  const selectedElement = useAtomValue(selectedElementAtom)
  const setSelected = useSetAtom(selectedElementAtom)
  const setHovered = useSetAtom(hoveredElementAtom)

  const switchTab = useCallback((mode: EditorPanelMode) => {
    setEditorPanelMode(mode)
    if (mode === 'code' && inspectMode) {
      setInspectMode(false)
      setSelected(null)
      setHovered(null)
      window.dispatchEvent(new CustomEvent('forge-inspect-toggle', { detail: { enabled: false } }))
    }
  }, [inspectMode, setEditorPanelMode, setInspectMode, setSelected, setHovered])

  return { editorPanelMode, setEditorPanelMode: switchTab, inspectMode, selectedElement }
}

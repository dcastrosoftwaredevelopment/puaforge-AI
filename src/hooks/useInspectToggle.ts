import { useCallback } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { inspectModeAtom, selectedElementAtom, hoveredElementAtom, editorPanelModeAtom } from '@/atoms'
import { useViewMode } from './useViewMode'

export function useInspectToggle() {
  const [inspectMode, setInspectMode] = useAtom(inspectModeAtom)
  const setSelected = useSetAtom(selectedElementAtom)
  const setHovered = useSetAtom(hoveredElementAtom)
  const setPanelMode = useSetAtom(editorPanelModeAtom)
  const { showPreview } = useViewMode()

  const toggleInspect = useCallback(() => {
    const next = !inspectMode
    setInspectMode(next)
    if (!next) {
      setSelected(null)
      setHovered(null)
      setPanelMode('code')
    }
    window.dispatchEvent(new CustomEvent('vibe-inspect-toggle', { detail: { enabled: next } }))
  }, [inspectMode, setInspectMode, setSelected, setHovered, setPanelMode])

  return { inspectMode, toggleInspect, showInspect: showPreview }
}

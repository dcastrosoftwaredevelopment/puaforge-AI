import { useAtomValue } from 'jotai'
import { selectedElementAtom, hoveredElementAtom, inspectModeAtom } from '@/atoms'

export function useSelectionOverlay() {
  const selectedElement = useAtomValue(selectedElementAtom)
  const hoveredElement = useAtomValue(hoveredElementAtom)
  const inspectMode = useAtomValue(inspectModeAtom)
  return { selectedElement, hoveredElement, inspectMode }
}

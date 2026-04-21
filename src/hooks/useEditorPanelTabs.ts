import { useAtom, useAtomValue } from 'jotai'
import { editorPanelModeAtom, inspectModeAtom, selectedElementAtom } from '@/atoms'

export function useEditorPanelTabs() {
  const [editorPanelMode, setEditorPanelMode] = useAtom(editorPanelModeAtom)
  const inspectMode = useAtomValue(inspectModeAtom)
  const selectedElement = useAtomValue(selectedElementAtom)
  return { editorPanelMode, setEditorPanelMode, inspectMode, selectedElement }
}

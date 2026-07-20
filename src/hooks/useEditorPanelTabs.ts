import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { editorPanelModeAtom, inspectModeAtom, selectedElementAtom, hoveredElementAtom } from '@/atoms';
import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { EditorPanelMode } from '@/atoms';
import { lsGet, lsSet } from './usePersistence';

export function useEditorPanelTabs() {
  const { projectId } = useParams<{ projectId: string }>();
  const [editorPanelMode, setEditorPanelMode] = useAtom(editorPanelModeAtom);
  const [inspectMode, setInspectMode] = useAtom(inspectModeAtom);
  const selectedElement = useAtomValue(selectedElementAtom);
  const setSelected = useSetAtom(selectedElementAtom);
  const setHovered = useSetAtom(hoveredElementAtom);

  // Load saved panel tab for this project; default to 'style' for new projects
  useEffect(() => {
    if (!projectId) return;
    const saved = lsGet(`editorPanelMode:${projectId}`);
    setEditorPanelMode((saved as EditorPanelMode) ?? 'style');
  }, [projectId, setEditorPanelMode]);

  const switchTab = useCallback(
    (mode: EditorPanelMode) => {
      setEditorPanelMode(mode);
      if (projectId) lsSet(`editorPanelMode:${projectId}`, mode);
      if (mode === 'code' && inspectMode) {
        setInspectMode(false);
        setSelected(null);
        setHovered(null);
        window.dispatchEvent(new CustomEvent('forge-inspect-toggle', { detail: { enabled: false } }));
      }
    },
    [projectId, inspectMode, setEditorPanelMode, setInspectMode, setSelected, setHovered],
  );

  return { editorPanelMode, setEditorPanelMode: switchTab, inspectMode, selectedElement };
}

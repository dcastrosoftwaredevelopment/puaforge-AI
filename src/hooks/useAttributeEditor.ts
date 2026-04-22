import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { selectedElementAtom, projectImagesAtom } from '@/atoms';
import { useFiles } from '@/hooks/useFiles';
import { updateAttributeInSource } from '@/utils/jsxInserter';

const EDITABLE_ATTRS: Record<string, string[]> = {
  a: ['href', 'target'],
  img: ['src', 'alt'],
  input: ['type', 'placeholder', 'name'],
  textarea: ['placeholder', 'name', 'rows'],
  button: ['type'],
  select: ['name'],
};

export function useAttributeEditor() {
  const selectedElement = useAtomValue(selectedElementAtom);
  const images = useAtomValue(projectImagesAtom);
  const { setFiles } = useFiles();

  const tagName = selectedElement?.tagName ?? '';
  const editableAttrs = EDITABLE_ATTRS[tagName] ?? [];
  const forgeBlockId = selectedElement?.forgeBlockId ?? '';
  const sourceAttrs = selectedElement?.attributes ?? {};

  const [pendingValues, setPendingValues] = useState<Record<string, string>>({});
  const [srcPickerOpen, setSrcPickerOpen] = useState(false);
  useEffect(() => {
    setPendingValues({});
    setSrcPickerOpen(false);
  }, [selectedElement?.id]);

  function attrValue(name: string): string {
    return name in pendingValues ? pendingValues[name] : (sourceAttrs[name] ?? '');
  }

  function setAttrValue(name: string, value: string) {
    setPendingValues((prev) => ({ ...prev, [name]: value }));
  }

  function commitAttr(name: string) {
    const value = attrValue(name);
    if (!forgeBlockId) return;
    setFiles((prev) => ({
      ...prev,
      '/App.tsx': updateAttributeInSource(prev['/App.tsx'] ?? '', forgeBlockId, name, value),
    }));
  }

  function applyAttr(name: string, value: string) {
    setPendingValues((prev) => ({ ...prev, [name]: value }));
    if (!forgeBlockId) return;
    setFiles((prev) => ({
      ...prev,
      '/App.tsx': updateAttributeInSource(prev['/App.tsx'] ?? '', forgeBlockId, name, value),
    }));
  }

  return {
    editableAttrs,
    tagName,
    canEdit: !!forgeBlockId && editableAttrs.length > 0,
    attrValue,
    setAttrValue,
    commitAttr,
    applyAttr,
    images,
    srcPickerOpen,
    setSrcPickerOpen,
  };
}

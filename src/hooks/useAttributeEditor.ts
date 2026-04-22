import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { selectedElementAtom } from '@/atoms';
import { useFiles } from '@/hooks/useFiles';
import { updateAttributeInSource } from '@/utils/jsxInserter';

// Attributes shown per tag. Only tags listed here get the Attributes section.
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
  const { setFiles } = useFiles();

  const tagName = selectedElement?.tagName ?? '';
  const editableAttrs = EDITABLE_ATTRS[tagName] ?? [];
  const forgeBlockId = selectedElement?.forgeBlockId ?? '';
  const sourceAttrs = selectedElement?.attributes ?? {};

  // Local pending values reset whenever the selected element changes.
  const [pendingValues, setPendingValues] = useState<Record<string, string>>({});
  useEffect(() => {
    setPendingValues({});
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

  return {
    editableAttrs,
    canEdit: !!forgeBlockId && editableAttrs.length > 0,
    attrValue,
    setAttrValue,
    commitAttr,
  };
}

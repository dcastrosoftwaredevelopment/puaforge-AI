import { useState, useEffect } from 'react';
import { useAtomValue, useStore, useSetAtom } from 'jotai';
import { useSandpack } from '@codesandbox/sandpack-react';
import { selectedElementAtom, filesAtom } from '@/atoms';
import { patchTextContent } from '@/utils/jsxInserter';

const TEXT_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'button', 'label', 'blockquote', 'li']);

export function useTextContentEditor() {
  const selectedElement = useAtomValue(selectedElementAtom);
  const store = useStore();
  const setFiles = useSetAtom(filesAtom);
  const { sandpack } = useSandpack();
  const [text, setText] = useState('');

  const tagName = selectedElement?.tagName ?? '';
  const forgeBlockId = selectedElement?.forgeBlockId ?? '';
  const sourceText = selectedElement?.textContent ?? '';
  const canEdit = TEXT_TAGS.has(tagName) && !!forgeBlockId && selectedElement?.textContent !== undefined;

  useEffect(() => {
    setText(sourceText);
  }, [selectedElement?.id, sourceText]);

  function commitText() {
    const trimmed = text.trim();
    if (!trimmed || !forgeBlockId) return;
    const files = store.get(filesAtom);
    const updates: Array<[string, string]> = [];
    for (const [path, code] of Object.entries(files)) {
      const patched = patchTextContent(code, forgeBlockId, tagName, trimmed);
      if (patched !== code) {
        updates.push([path, patched]);
        break;
      }
    }
    if (updates.length === 0) return;
    setFiles((prev) => {
      const next = { ...prev };
      for (const [path, code] of updates) next[path] = code;
      return next;
    });
    for (const [path, code] of updates) sandpack.updateFile(path, code);
  }

  return { canEdit, text, setText, commitText };
}

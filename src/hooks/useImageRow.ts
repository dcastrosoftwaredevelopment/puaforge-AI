import { useState, useRef } from 'react';
import { baseName } from '@/utils/imageUtils';

export function useImageRow(img: { id: string; name: string }, onRename: (id: string, name: string) => void) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing() {
    setEditValue(baseName(img.name));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function confirmRename() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== baseName(img.name)) {
      onRename(img.id, trimmed);
    }
    setEditing(false);
  }

  function cancelRename() {
    setEditing(false);
  }

  return { editing, editValue, setEditValue, inputRef, startEditing, confirmRename, cancelRename };
}

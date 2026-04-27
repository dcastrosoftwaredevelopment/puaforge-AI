import { useState, useCallback, useRef, useEffect } from 'react';
import { useSandpack } from '@codesandbox/sandpack-react';
import { useFiles } from './useFiles';

export function useNewFile() {
  const [isCreating, setIsCreating] = useState(false);
  const [fileName, setFileName] = useState('');
  const { setFiles } = useFiles();
  const { sandpack } = useSandpack();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating) inputRef.current?.focus();
  }, [isCreating]);

  const startCreate = useCallback(() => {
    setFileName('');
    setIsCreating(true);
  }, []);

  const cancelCreate = useCallback(() => {
    setIsCreating(false);
    setFileName('');
  }, []);

  const confirmCreate = useCallback(() => {
    const name = fileName.trim();
    if (!name) {
      setIsCreating(false);
      setFileName('');
      return;
    }
    const path = name.startsWith('/') ? name : `/${name}`;
    setFiles((prev) => ({ ...prev, [path]: '' }));
    sandpack.openFile(path);
    setIsCreating(false);
    setFileName('');
  }, [fileName, setFiles, sandpack]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') confirmCreate();
      if (e.key === 'Escape') cancelCreate();
    },
    [confirmCreate, cancelCreate],
  );

  return { isCreating, fileName, setFileName, inputRef, startCreate, cancelCreate, confirmCreate, handleKeyDown };
}

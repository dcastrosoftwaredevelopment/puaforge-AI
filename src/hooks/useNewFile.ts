import { useState, useCallback, useRef, useEffect } from 'react';
import { useFiles } from './useFiles';

function tsxBoilerplate(path: string): string {
  const base = path.split('/').pop()?.replace(/\.tsx$/, '') ?? 'Component';
  const name = base.charAt(0).toUpperCase() + base.slice(1);
  return `export default function ${name}() {\n  return (\n    <div>\n      \n    </div>\n  );\n}\n`;
}

export function useNewFile() {
  const [isCreating, setIsCreating] = useState(false);
  const [fileName, setFileName] = useState('');
  const { setFiles } = useFiles();
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
    const content = path.endsWith('.tsx') ? tsxBoilerplate(path) : '';
    setFiles((prev) => ({ ...prev, [path]: content }));
    setIsCreating(false);
    setFileName('');
  }, [fileName, setFiles]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') confirmCreate();
      if (e.key === 'Escape') cancelCreate();
    },
    [confirmCreate, cancelCreate],
  );

  return { isCreating, fileName, setFileName, inputRef, startCreate, cancelCreate, confirmCreate, handleKeyDown };
}

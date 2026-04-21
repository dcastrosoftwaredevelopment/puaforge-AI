import { useContext } from 'react';
import { CodeViewerContext } from '@/contexts/codeViewerContext';

export function useCodeViewer() {
  return useContext(CodeViewerContext);
}

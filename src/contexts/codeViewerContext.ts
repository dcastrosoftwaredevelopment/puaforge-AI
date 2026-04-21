import { createContext } from 'react';

export interface CodeEntry { language: string; filePath?: string; code: string }

export interface CodeViewerContextValue {
  open: (entry: CodeEntry) => void
}

export const CodeViewerContext = createContext<CodeViewerContextValue>({ open: () => {} });

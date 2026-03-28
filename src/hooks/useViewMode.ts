import { useAtom } from 'jotai'
import { viewModeAtom } from '@/atoms'

export function useViewMode() {
  const [viewMode, setViewMode] = useAtom(viewModeAtom)

  const showEditor = viewMode === 'editor' || viewMode === 'split'
  const showPreview = viewMode === 'preview' || viewMode === 'split'
  const isSplit = viewMode === 'split'

  return { viewMode, setViewMode, showEditor, showPreview, isSplit }
}

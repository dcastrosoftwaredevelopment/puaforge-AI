import { useAtomValue } from 'jotai'
import { widthAtom, heightAtom, maxWidthAtom, selectedElementAtom } from '@/atoms'
import { useStyleEditor } from './useStyleEditor'

export function useDimensionsSection() {
  const width      = useAtomValue(widthAtom)
  const height     = useAtomValue(heightAtom)
  const maxWidth   = useAtomValue(maxWidthAtom)
  const elementId  = useAtomValue(selectedElementAtom)?.id
  const { withDebounce, flushDebounce, applyLiveClass, removeLiveCategory, commitClassName } = useStyleEditor()
  return { width, height, maxWidth, elementId, withDebounce, flushDebounce, applyLiveClass, removeLiveCategory, commitClassName }
}

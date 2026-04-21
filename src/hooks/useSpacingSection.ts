import { useAtomValue } from 'jotai';
import {
  paddingTopAtom,
  paddingRightAtom,
  paddingBottomAtom,
  paddingLeftAtom,
  marginTopAtom,
  marginRightAtom,
  marginBottomAtom,
  marginLeftAtom,
} from '@/atoms';
import { useStyleEditor } from './useStyleEditor';

export function useSpacingSection() {
  const paddingTop = useAtomValue(paddingTopAtom);
  const paddingRight = useAtomValue(paddingRightAtom);
  const paddingBottom = useAtomValue(paddingBottomAtom);
  const paddingLeft = useAtomValue(paddingLeftAtom);
  const marginTop = useAtomValue(marginTopAtom);
  const marginRight = useAtomValue(marginRightAtom);
  const marginBottom = useAtomValue(marginBottomAtom);
  const marginLeft = useAtomValue(marginLeftAtom);
  const { applyClass, removeCategory } = useStyleEditor();
  return {
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    applyClass,
    removeCategory,
  };
}

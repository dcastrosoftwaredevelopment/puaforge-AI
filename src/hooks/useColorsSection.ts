import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { bgColorAtom, projectImagesAtom, selectedElementAtom } from '@/atoms';
import { parseInlineStyle } from '@/utils/inlineStyles';
import { useStyleEditor } from './useStyleEditor';

export const BG_SIZE_OPTIONS = [
  { label: 'cover', value: 'cover' },
  { label: 'contain', value: 'contain' },
  { label: 'auto', value: 'auto' },
  { label: '100%', value: '100%' },
  { label: '100% 100%', value: '100% 100%' },
];

export const BG_REPEAT_OPTIONS = [
  { label: 'no-repeat', value: 'no-repeat' },
  { label: 'repeat', value: 'repeat' },
  { label: 'repeat-x', value: 'repeat-x' },
  { label: 'repeat-y', value: 'repeat-y' },
];

export const BG_POSITION_OPTIONS = [
  { label: 'center', value: 'center' },
  { label: 'top', value: 'top' },
  { label: 'bottom', value: 'bottom' },
  { label: 'left', value: 'left' },
  { label: 'right', value: 'right' },
  { label: 'top left', value: 'top left' },
  { label: 'top center', value: 'top center' },
  { label: 'top right', value: 'top right' },
  { label: 'bottom left', value: 'bottom left' },
  { label: 'bottom center', value: 'bottom center' },
  { label: 'bottom right', value: 'bottom right' },
];

export function useColorsSection() {
  const bgColor = useAtomValue(bgColorAtom);
  const selectedElement = useAtomValue(selectedElementAtom);
  const images = useAtomValue(projectImagesAtom);
  const { applyClass, applyLiveInlineProp, commitInlineStyle } = useStyleEditor();
  const [pickerOpen, setPickerOpen] = useState(false);

  const inlineStyle = selectedElement?.inlineStyle ?? '';
  const parsed = parseInlineStyle(inlineStyle);
  const bgImageVal = parsed['background-image'] ?? '';
  const bgSize = parsed['background-size'] ?? '';
  const bgRepeat = parsed['background-repeat'] ?? '';
  const bgPosition = parsed['background-position'] ?? '';
  const elementId = selectedElement?.id ?? '';

  function applyBgImage(value: string) {
    let cssValue = '';
    if (value) {
      // Already a CSS function (var(), url(), gradient…) — use as-is
      cssValue =
        /^(var|url|linear-gradient|radial-gradient|conic-gradient)\s*\(/.test(value.trim()) ?
          value
        : `url('${value}')`;
    }
    applyLiveInlineProp('background-image', cssValue);
    commitInlineStyle();
  }

  function applyBgProp(prop: string, value: string) {
    applyLiveInlineProp(prop, value);
    commitInlineStyle();
  }

  return {
    bgColor,
    applyClass,
    bgImageVal,
    bgSize,
    bgRepeat,
    bgPosition,
    applyBgImage,
    applyBgProp,
    images,
    elementId,
    pickerOpen,
    setPickerOpen,
  };
}

import { memo } from 'react';
import { ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toCssVarName } from '@/utils/imageUtils';
import { useColorsSection, BG_SIZE_OPTIONS, BG_REPEAT_OPTIONS, BG_POSITION_OPTIONS } from '@/hooks/useColorsSection';
import StyleEditorSection from './StyleEditorSection';
import StyleEditorRow from './StyleEditorRow';
import StyleEditorColorInput from './StyleEditorColorInput';
import StyleEditorSelect from './StyleEditorSelect';
import ImagePickerDropdown from './ImagePickerDropdown';

const inputCls =
  'flex-1 min-w-0 text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary outline-none focus:border-forge-terracotta font-mono';

const ColorsSection = memo(() => {
  const { t } = useTranslation();
  const {
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
  } = useColorsSection();

  return (
    <StyleEditorSection title={t('inspect.sectionColors')}>
      <StyleEditorRow label={t('inspect.bgColor')}>
        <StyleEditorColorInput key={`${elementId}-bc`} value={bgColor} onChange={(v) => applyClass(v)} prefix="bg-" />
      </StyleEditorRow>
      <StyleEditorRow label={t('inspect.bgImage')}>
        <div className="relative flex items-center gap-1">
          <input
            key={`${elementId}-bgi`}
            type="text"
            defaultValue={bgImageVal}
            placeholder="https://..."
            onBlur={(e) => applyBgImage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            className={inputCls}
          />
          <button
            onClick={() => setPickerOpen((o) => !o)}
            title={t('inspect.pickImage')}
            className="p-1 rounded text-text-muted hover:text-forge-terracotta transition cursor-pointer shrink-0"
          >
            <ImageIcon size={12} />
          </button>
          {pickerOpen && (
            <ImagePickerDropdown
              images={images}
              onSelect={(img) => {
                applyBgProp('background-image', `var(${toCssVarName(img.name)})`);
                setPickerOpen(false);
              }}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
      </StyleEditorRow>
      {bgImageVal && (
        <>
          <StyleEditorRow label={t('inspect.bgSize')}>
            <StyleEditorSelect
              key={`${elementId}-bgsz`}
              value={bgSize}
              onChange={(v) => applyBgProp('background-size', v)}
              options={BG_SIZE_OPTIONS}
            />
          </StyleEditorRow>
          <StyleEditorRow label={t('inspect.bgRepeat')}>
            <StyleEditorSelect
              key={`${elementId}-bgrp`}
              value={bgRepeat}
              onChange={(v) => applyBgProp('background-repeat', v)}
              options={BG_REPEAT_OPTIONS}
            />
          </StyleEditorRow>
          <StyleEditorRow label={t('inspect.bgPosition')}>
            <StyleEditorSelect
              key={`${elementId}-bgps`}
              value={bgPosition}
              onChange={(v) => applyBgProp('background-position', v)}
              options={BG_POSITION_OPTIONS}
            />
          </StyleEditorRow>
        </>
      )}
    </StyleEditorSection>
  );
});

export default ColorsSection;

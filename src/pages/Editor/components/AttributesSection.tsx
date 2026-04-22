import { memo } from 'react';
import { ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAttributeEditor } from '@/hooks/useAttributeEditor';
import StyleEditorSection from './StyleEditorSection';
import StyleEditorRow from './StyleEditorRow';
import ImagePickerDropdown from './ImagePickerDropdown';

const AttributesSection = memo(() => {
  const { t } = useTranslation();
  const {
    editableAttrs,
    tagName,
    canEdit,
    attrValue,
    setAttrValue,
    commitAttr,
    applyAttr,
    images,
    srcPickerOpen,
    setSrcPickerOpen,
  } = useAttributeEditor();

  if (!canEdit) return null;

  return (
    <StyleEditorSection title={t('inspect.sectionAttributes')} defaultOpen={true}>
      {editableAttrs.map((attr) => {
        const isSrcOnImg = attr === 'src' && tagName === 'img';
        return (
          <StyleEditorRow key={attr} label={attr}>
            <div className="relative flex items-center gap-1">
              <input
                type="text"
                value={attrValue(attr)}
                onChange={(e) => setAttrValue(attr, e.target.value)}
                onBlur={() => commitAttr(attr)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
                className="flex-1 min-w-0 text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary outline-none focus:border-forge-terracotta font-mono"
              />
              {isSrcOnImg && (
                <>
                  <button
                    onClick={() => setSrcPickerOpen((o) => !o)}
                    title={t('inspect.pickImage')}
                    className="p-1 rounded text-text-muted hover:text-forge-terracotta transition cursor-pointer shrink-0"
                  >
                    <ImageIcon size={12} />
                  </button>
                  {srcPickerOpen && (
                    <ImagePickerDropdown
                      images={images}
                      onSelect={(img) => {
                        applyAttr(attr, img.dataUrl ?? img.url);
                        setSrcPickerOpen(false);
                      }}
                      onClose={() => setSrcPickerOpen(false)}
                    />
                  )}
                </>
              )}
            </div>
          </StyleEditorRow>
        );
      })}
    </StyleEditorSection>
  );
});

export default AttributesSection;

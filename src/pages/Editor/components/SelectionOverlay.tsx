import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSelectionOverlay } from '@/hooks/useSelectionOverlay';

export default function SelectionOverlay() {
  const { t } = useTranslation();
  const { selectedElement, hoveredElement, inspectMode, removeSelectedBlock } = useSelectionOverlay();

  if (!inspectMode) return null;

  return (
    <>
      {hoveredElement && hoveredElement.id !== selectedElement?.id && (
        <div
          className="pointer-events-none border border-dashed border-sky-400/70 bg-sky-400/5 z-10"
          style={{
            position: 'absolute',
            boxSizing: 'border-box',
            top: hoveredElement.rect.top,
            left: hoveredElement.rect.left,
            width: hoveredElement.rect.width,
            height: hoveredElement.rect.height,
          }}
        />
      )}
      {selectedElement && (
        <div
          className="pointer-events-none border border-forge-terracotta z-10"
          style={{
            position: 'absolute',
            boxSizing: 'border-box',
            top: selectedElement.rect.top,
            left: selectedElement.rect.left,
            width: selectedElement.rect.width,
            height: selectedElement.rect.height,
          }}
        >
          <div className="absolute -top-5 left-0 flex items-center gap-0.5">
            <span className="bg-forge-terracotta text-white text-[10px] px-1.5 py-0.5 leading-none rounded-sm select-none">
              {selectedElement.tagName}
            </span>
            {selectedElement.forgeBlockId && (
              <button
                type="button"
                onClick={removeSelectedBlock}
                title={t('blocks.removeBlock')}
                className="pointer-events-auto flex items-center bg-red-500 hover:bg-red-600 text-white transition px-1 py-0.5 rounded-sm"
              >
                <Trash2 size={9} />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

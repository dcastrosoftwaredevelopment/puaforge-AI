import { useSelectionOverlay } from '@/hooks/useSelectionOverlay';

export default function SelectionOverlay() {
  const { selectedElement, hoveredElement, inspectMode, iframeOffset } = useSelectionOverlay();

  if (!inspectMode) return null;

  return (
    <div data-forge-overlay="" className="absolute inset-0 pointer-events-none">
      {hoveredElement && hoveredElement.id !== selectedElement?.id && (
        <div
          className="absolute pointer-events-none border border-dashed border-sky-400/70 bg-sky-400/5 z-40"
          style={{
            boxSizing: 'border-box',
            top: hoveredElement.rect.top + iframeOffset.top,
            left: hoveredElement.rect.left + iframeOffset.left,
            width: hoveredElement.rect.width,
            height: hoveredElement.rect.height,
          }}
        />
      )}
      {selectedElement && (
        <div
          className="absolute pointer-events-none border border-forge-terracotta z-40"
          style={{
            boxSizing: 'border-box',
            top: selectedElement.rect.top + iframeOffset.top,
            left: selectedElement.rect.left + iframeOffset.left,
            width: selectedElement.rect.width,
            height: selectedElement.rect.height,
          }}
        >
          <span className="absolute -top-5 left-0 bg-forge-terracotta text-white text-[10px] px-1.5 py-0.5 leading-none rounded-sm select-none">
            {selectedElement.tagName}
          </span>
        </div>
      )}
    </div>
  );
}

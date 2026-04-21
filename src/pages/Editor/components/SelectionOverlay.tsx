import { useSelectionOverlay } from '@/hooks/useSelectionOverlay';

export default function SelectionOverlay() {
  const { selectedElement, hoveredElement, inspectMode, iframeOrigin } = useSelectionOverlay();

  if (!inspectMode) return null;

  return (
    <>
      {hoveredElement && hoveredElement.id !== selectedElement?.id && (
        <div
          className="pointer-events-none border border-dashed border-sky-400/70 bg-sky-400/5 z-10"
          style={{
            position: 'fixed',
            boxSizing: 'border-box',
            top: hoveredElement.rect.top + iframeOrigin.top,
            left: hoveredElement.rect.left + iframeOrigin.left,
            width: hoveredElement.rect.width,
            height: hoveredElement.rect.height,
          }}
        />
      )}
      {selectedElement && (
        <div
          className="pointer-events-none border border-forge-terracotta z-10"
          style={{
            position: 'fixed',
            boxSizing: 'border-box',
            top: selectedElement.rect.top + iframeOrigin.top,
            left: selectedElement.rect.left + iframeOrigin.left,
            width: selectedElement.rect.width,
            height: selectedElement.rect.height,
          }}
        >
          <span className="absolute -top-5 left-0 bg-forge-terracotta text-white text-[10px] px-1.5 py-0.5 leading-none rounded-sm select-none">
            {selectedElement.tagName}
          </span>
        </div>
      )}
    </>
  );
}

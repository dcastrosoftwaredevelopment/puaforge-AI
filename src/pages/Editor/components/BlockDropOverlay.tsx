interface BlockDropOverlayProps {
  onDrop: () => void;
  onDragOver: (e: React.DragEvent) => void;
}

export default function BlockDropOverlay({ onDrop, onDragOver }: BlockDropOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-20"
      onDragOver={(e) => { e.preventDefault(); onDragOver(e); }}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
    >
      <div className="absolute inset-2 rounded-xl border-2 border-dashed border-forge-terracotta/40 pointer-events-none" />
    </div>
  );
}

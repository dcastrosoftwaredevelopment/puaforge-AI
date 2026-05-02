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
    />
  );
}

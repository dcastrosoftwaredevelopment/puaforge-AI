import { useTranslation } from 'react-i18next';
import { CornerDownRight } from 'lucide-react';

interface BlockDropOverlayProps {
  onDrop: () => void;
  targetLabel?: string | null;
}

export default function BlockDropOverlay({ onDrop, targetLabel }: BlockDropOverlayProps) {
  const { t } = useTranslation();
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      <div className="absolute inset-2 rounded-xl border-2 border-dashed border-forge-terracotta/60 bg-forge-terracotta/5 pointer-events-none" />
      <div className="relative flex items-center gap-1.5 bg-forge-terracotta text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg pointer-events-none">
        {targetLabel && <CornerDownRight size={11} />}
        {targetLabel ? `${t('blocks.dropInside')} ${targetLabel}` : t('blocks.dropHere')}
      </div>
    </div>
  );
}

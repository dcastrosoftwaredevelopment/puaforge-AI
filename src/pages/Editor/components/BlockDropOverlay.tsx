import { useTranslation } from 'react-i18next';

interface BlockDropOverlayProps {
  onDrop: () => void;
}

export default function BlockDropOverlay({ onDrop }: BlockDropOverlayProps) {
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
      <div className="relative bg-forge-terracotta text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg pointer-events-none">
        {t('blocks.dropHere')}
      </div>
    </div>
  );
}

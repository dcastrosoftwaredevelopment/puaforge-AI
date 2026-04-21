import { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectImages } from '@/hooks/useProjectImages';
import ImageRow from './ImageRow';

export default function ImageAssets() {
  const { images, addImage, renameImage, removeImage } = useProjectImages();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        await addImage(file);
      }
    }
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{t('images.title')}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary bg-bg-elevated border border-border-subtle rounded-md transition cursor-pointer"
        >
          <ImagePlus size={12} />
          {t('images.upload')}
        </button>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-4 space-y-2">
          <p className="text-xs text-text-muted">{t('images.empty')}</p>
          <p className="text-[10px] text-text-muted/70 leading-relaxed whitespace-pre-line">{t('images.emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {images.map((img) => (
            <ImageRow key={img.id} img={img} onRename={renameImage} onRemove={removeImage} />
          ))}
          <p className="text-[10px] text-text-muted/70 leading-relaxed pt-1">{t('images.helper')}</p>
        </div>
      )}
    </div>
  );
}

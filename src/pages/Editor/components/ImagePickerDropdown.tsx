import { useTranslation } from 'react-i18next';

export interface PickerImage {
  id: string;
  name: string;
  url: string;
  dataUrl?: string;
}

interface Props {
  images: PickerImage[];
  onSelect: (image: PickerImage) => void;
  onClose: () => void;
}

export default function ImagePickerDropdown({ images, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute z-50 top-full right-0 mt-1 bg-bg-secondary border border-border-subtle rounded-lg shadow-lg p-2 w-52 max-h-52 overflow-y-auto">
        {images.length === 0 ?
          <p className="text-[10px] text-text-muted text-center py-2">{t('inspect.noImages')}</p>
        : <div className="grid grid-cols-3 gap-1">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => {
                  onSelect(img);
                  onClose();
                }}
                title={img.name}
                className="aspect-square rounded overflow-hidden border border-border-subtle hover:border-forge-terracotta transition cursor-pointer"
              >
                <img src={img.dataUrl ?? img.url} alt={img.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        }
      </div>
    </>
  );
}

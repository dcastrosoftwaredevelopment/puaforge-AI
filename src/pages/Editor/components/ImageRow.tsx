import { useRef, useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toExportName, formatSize, baseName } from '@/utils/imageUtils';
import CopyButton from './CopyButton';

export default function ImageRow({
  img,
  onRename,
  onRemove,
}: {
  img: { id: string; name: string; url: string; size: number };
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const startEditing = () => {
    setEditValue(baseName(img.name));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const confirmRename = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== baseName(img.name)) {
      onRename(img.id, trimmed);
    }
    setEditing(false);
  };

  const cancelRename = () => setEditing(false);

  const exportName = toExportName(img.name);

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary border border-border-subtle group">
      <img src={img.url} alt={img.name} className="w-10 h-10 rounded object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        {editing ?
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') cancelRename();
              }}
              className="flex-1 min-w-0 text-xs bg-bg-elevated border border-border-default rounded px-1.5 py-0.5 text-text-primary outline-none focus:border-accent"
              autoFocus
            />
            <button
              onClick={confirmRename}
              className="p-0.5 text-success hover:text-vibe-blue transition cursor-pointer"
            >
              <Check size={11} />
            </button>
            <button
              onClick={cancelRename}
              className="p-0.5 text-text-muted hover:text-text-primary transition cursor-pointer"
            >
              <X size={11} />
            </button>
          </div>
        : <p
            className="text-xs text-text-primary truncate cursor-pointer hover:text-accent transition"
            onDoubleClick={startEditing}
            title={t('images.doubleClickRename')}
          >
            {img.name}
          </p>
        }
        <p className="text-[10px] text-text-muted">{formatSize(img.size)}</p>
      </div>
      {!editing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <CopyButton text={t('images.copyTemplate', { name: exportName })} />
          <button
            onClick={startEditing}
            className="p-1 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
            title={t('images.rename')}
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onRemove(img.id)}
            className="p-1 rounded text-text-muted hover:text-forge-terracotta transition cursor-pointer"
            title={t('images.remove')}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

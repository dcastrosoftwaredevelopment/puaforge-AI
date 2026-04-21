import { useState, useRef } from 'react';
import { RotateCcw, Trash2, Pencil, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/utils/dateUtils';

export default function CheckpointRow({ checkpoint, onRestore, onDelete, onRename }: {
  checkpoint: { id: string; name: string; files: Record<string, string>; createdAt: number }
  onRestore: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { t, i18n } = useTranslation();

  const startEditing = () => {
    setEditValue(checkpoint.name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const confirmRename = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== checkpoint.name) {
      onRename(checkpoint.id, trimmed);
    }
    setEditing(false);
  };

  const fileCount = Object.keys(checkpoint.files).length;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary border border-border-subtle group">
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') setEditing(false);
              }}
              className="flex-1 min-w-0 text-xs bg-bg-elevated border border-border-default rounded px-1.5 py-0.5 text-text-primary outline-none focus:border-accent"
              autoFocus
            />
            <button onClick={confirmRename} className="p-0.5 text-success hover:text-vibe-blue transition cursor-pointer">
              <Check size={11} />
            </button>
            <button onClick={() => setEditing(false)} className="p-0.5 text-text-muted hover:text-text-primary transition cursor-pointer">
              <X size={11} />
            </button>
          </div>
        ) : (
          <p
            className="text-xs text-text-primary truncate cursor-pointer hover:text-accent transition"
            onDoubleClick={startEditing}
            title={t('checkpoints.doubleClickRename')}
          >
            {checkpoint.name}
          </p>
        )}
        <p className="text-[10px] text-text-muted">
          {formatDate(checkpoint.createdAt, i18n.language)} &middot; {t('checkpoints.files', { count: fileCount })}
        </p>
      </div>
      {!editing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => onRestore(checkpoint.id)}
            className="p-1 rounded text-text-muted hover:text-accent transition cursor-pointer"
            title={t('checkpoints.restore')}
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={startEditing}
            className="p-1 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
            title={t('checkpoints.rename')}
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(checkpoint.id)}
            className="p-1 rounded text-text-muted hover:text-forge-terracotta transition cursor-pointer"
            title={t('checkpoints.delete')}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

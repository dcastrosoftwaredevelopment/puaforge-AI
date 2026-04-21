import { useState } from 'react';
import { Save, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCheckpoints } from '@/hooks/useCheckpoints';
import CheckpointRow from './CheckpointRow';

export default function Checkpoints() {
  const { checkpoints, createCheckpoint, restoreCheckpoint, deleteCheckpoint, renameCheckpoint } = useCheckpoints();
  const [newName, setNewName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const { t } = useTranslation();

  const handleCreate = () => {
    createCheckpoint(newName);
    setNewName('');
    setShowInput(false);
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{t('checkpoints.title')}</span>
        {showInput ? (
          <div className="flex items-center gap-1">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setShowInput(false);
              }}
              placeholder={t('checkpoints.placeholder')}
              className="w-36 text-xs bg-bg-elevated border border-border-default rounded px-2 py-1 text-text-primary outline-none focus:border-accent placeholder-text-muted"
              autoFocus
            />
            <button
              onClick={handleCreate}
              className="p-1 rounded text-success hover:text-vibe-blue transition cursor-pointer"
            >
              <Check size={12} />
            </button>
            <button
              onClick={() => setShowInput(false)}
              className="p-1 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary bg-bg-elevated border border-border-subtle rounded-md transition cursor-pointer"
          >
            <Save size={12} />
            {t('checkpoints.save')}
          </button>
        )}
      </div>

      {checkpoints.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-4">{t('checkpoints.empty')}</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {checkpoints.map((cp) => (
            <CheckpointRow
              key={cp.id}
              checkpoint={cp}
              onRestore={restoreCheckpoint}
              onDelete={deleteCheckpoint}
              onRename={renameCheckpoint}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { useRef, useState } from 'react';
import { Lock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ColorRow({
  name,
  value,
  locked,
  onUpdate,
  onRemove,
}: {
  id: string;
  name: string;
  value: string;
  locked?: boolean;
  onUpdate: (updates: { name?: string; value?: string }) => void;
  onRemove: () => void;
}) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(name);
  const { t } = useTranslation();

  function commitName() {
    setEditingName(false);
    const trimmed = nameVal.trim();
    if (trimmed && trimmed !== name) onUpdate({ name: trimmed });
    else setNameVal(name);
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-3 hover:bg-bg-elevated/50 rounded-lg group transition">
      <button
        className="w-6 h-6 rounded-md border border-[rgba(255,255,255,0.12)] shrink-0 cursor-pointer transition hover:scale-110"
        style={{ background: value }}
        onClick={() => colorInputRef.current?.click()}
        title={t('palette.changeColor')}
      />
      <input
        ref={colorInputRef}
        type="color"
        value={value}
        className="sr-only"
        onChange={(e) => onUpdate({ value: e.target.value })}
      />

      {editingName ? (
        <input
          autoFocus
          value={nameVal}
          onChange={(e) => setNameVal(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitName();
            if (e.key === 'Escape') {
              setNameVal(name);
              setEditingName(false);
            }
          }}
          className="flex-1 bg-bg-elevated border border-border-default rounded px-1.5 py-0.5 text-xs text-text-primary focus:outline-none focus:border-accent/50"
        />
      ) : (
        <span
          className="flex-1 text-xs text-text-secondary truncate cursor-pointer hover:text-text-primary transition"
          onClick={() => setEditingName(true)}
          title={t('palette.editName')}
        >
          {name}
        </span>
      )}

      <span className="text-[10px] font-mono text-text-muted tracking-wide shrink-0">{value.toUpperCase()}</span>

      {locked ? (
        <Lock size={10} className="text-text-muted/40 shrink-0" />
      ) : (
        <button
          onClick={onRemove}
          className="p-0.5 rounded text-text-muted/40 hover:text-forge-terracotta opacity-0 group-hover:opacity-100 transition cursor-pointer shrink-0"
          title={t('palette.removeColor')}
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

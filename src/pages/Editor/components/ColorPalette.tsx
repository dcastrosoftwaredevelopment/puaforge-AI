import { useState } from 'react';
import { Plus, RotateCcw, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useColorPalette } from '@/hooks/useColorPalette';
import ColorRow from './ColorRow';

export default function ColorPalette() {
  const { palette, addColor, updateColor, removeColor, resetToDefaults } = useColorPalette();
  const { t } = useTranslation();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle">
        <span className="text-xs font-semibold text-text-secondary">{t('palette.title')}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={resetToDefaults}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
            title={t('palette.resetDefault')}
          >
            <RotateCcw size={11} />
          </button>
          <button
            onClick={() => addColor({ name: t('palette.newColor'), value: '#6366f1' })}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-accent bg-accent/10 hover:bg-accent/20 transition cursor-pointer"
          >
            <Plus size={11} />
            {t('palette.addColor')}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 px-3 py-2.5 border-b border-border-subtle">
        {palette.map((c) => (
          <button
            key={c.id}
            onClick={() => handleCopy(c.id, c.value)}
            className="relative w-5 h-5 rounded border border-[rgba(255,255,255,0.1)] cursor-pointer hover:scale-110 transition-transform shrink-0"
            style={{ background: c.value }}
            title={`${c.name}: ${c.value}`}
          >
            {copiedId === c.id && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                <Check size={10} className="text-white" />
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="max-h-64 overflow-y-auto py-1">
        {palette.map((c) => (
          <ColorRow
            key={c.id}
            {...c}
            onUpdate={(updates) => updateColor(c.id, updates)}
            onRemove={() => removeColor(c.id)}
          />
        ))}
      </div>

      <p className="px-3 py-2 text-[10px] text-text-muted border-t border-border-subtle leading-relaxed">
        {t('palette.helper')}
      </p>
    </div>
  );
}

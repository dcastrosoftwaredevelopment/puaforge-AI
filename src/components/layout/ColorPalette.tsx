import { useRef, useState } from 'react'
import { Plus, RotateCcw, Lock, X } from 'lucide-react'
import { useColorPalette } from '@/hooks/useColorPalette'

function ColorRow({
  name,
  value,
  locked,
  onUpdate,
  onRemove,
}: {
  id: string
  name: string
  value: string
  locked?: boolean
  onUpdate: (updates: { name?: string; value?: string }) => void
  onRemove: () => void
}) {
  const colorInputRef = useRef<HTMLInputElement>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(name)

  function commitName() {
    setEditingName(false)
    const trimmed = nameVal.trim()
    if (trimmed && trimmed !== name) onUpdate({ name: trimmed })
    else setNameVal(name)
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-3 hover:bg-bg-elevated/50 rounded-lg group transition">
      {/* Swatch — triggers native color picker */}
      <button
        className="w-6 h-6 rounded-md border border-[rgba(255,255,255,0.12)] shrink-0 cursor-pointer transition hover:scale-110"
        style={{ background: value }}
        onClick={() => colorInputRef.current?.click()}
        title="Alterar cor"
      />
      <input
        ref={colorInputRef}
        type="color"
        value={value}
        className="sr-only"
        onChange={(e) => onUpdate({ value: e.target.value })}
      />

      {/* Name */}
      {editingName ? (
        <input
          autoFocus
          value={nameVal}
          onChange={(e) => setNameVal(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setNameVal(name); setEditingName(false) } }}
          className="flex-1 bg-bg-elevated border border-border-default rounded px-1.5 py-0.5 text-xs text-text-primary focus:outline-none focus:border-accent/50"
        />
      ) : (
        <span
          className="flex-1 text-xs text-text-secondary truncate cursor-pointer hover:text-text-primary transition"
          onClick={() => setEditingName(true)}
          title="Clique para editar o nome"
        >
          {name}
        </span>
      )}

      {/* Hex value */}
      <span className="text-[10px] font-mono text-text-muted tracking-wide shrink-0">{value.toUpperCase()}</span>

      {/* Actions */}
      {locked ? (
        <Lock size={10} className="text-text-muted/40 shrink-0" />
      ) : (
        <button
          onClick={onRemove}
          className="p-0.5 rounded text-text-muted/40 hover:text-forge-terracotta opacity-0 group-hover:opacity-100 transition cursor-pointer shrink-0"
          title="Remover cor"
        >
          <X size={11} />
        </button>
      )}
    </div>
  )
}

export default function ColorPalette() {
  const { palette, addColor, updateColor, removeColor, resetToDefaults } = useColorPalette()

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle">
        <span className="text-xs font-semibold text-text-secondary">Paleta de cores</span>
        <div className="flex items-center gap-1">
          <button
            onClick={resetToDefaults}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
            title="Restaurar padrão"
          >
            <RotateCcw size={11} />
          </button>
          <button
            onClick={() => addColor({ name: 'Nova cor', value: '#6366f1' })}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-accent bg-accent/10 hover:bg-accent/20 transition cursor-pointer"
          >
            <Plus size={11} />
            Adicionar
          </button>
        </div>
      </div>

      {/* Swatches grid */}
      <div className="flex flex-wrap gap-1.5 px-3 py-2.5 border-b border-border-subtle">
        {palette.map((c) => (
          <div
            key={c.id}
            className="w-5 h-5 rounded border border-[rgba(255,255,255,0.1)]"
            style={{ background: c.value }}
            title={`${c.name}: ${c.value}`}
          />
        ))}
      </div>

      {/* Color list */}
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
        Clique no swatch para alterar a cor. Clique no nome para renomear. A IA usará estas cores automaticamente.
      </p>
    </div>
  )
}

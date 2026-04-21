import { SPACING_SCALE } from '@/utils/tailwindClasses'

export default function StyleEditorSpacingInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-text-muted/50 w-4 text-center">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-[11px] bg-bg-elevated border border-border-subtle rounded px-1 py-0.5 text-text-secondary outline-none focus:border-forge-terracotta cursor-pointer"
      >
        <option value="" />
        {SPACING_SCALE.map((n) => <option key={n} value={String(n)}>{n}</option>)}
      </select>
    </div>
  )
}

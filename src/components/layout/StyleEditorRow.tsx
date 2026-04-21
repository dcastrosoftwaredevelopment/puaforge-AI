export default function StyleEditorRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-text-muted/70 w-20 shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

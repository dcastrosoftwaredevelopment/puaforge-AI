import { useState, useRef, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'

export default function StyleEditorColorInput({ value, onChange, prefix = '' }: { value: string; onChange: (v: string) => void; prefix?: string }) {
  const [copied, setCopied] = useState(false)
  const hexMatch = value.match(/\[#([0-9a-fA-F]{3,6})\]/)
  const hex = hexMatch ? `#${hexMatch[1]}` : '#000000'
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textRef = useRef<HTMLInputElement>(null)
  const colorRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (textRef.current && document.activeElement !== textRef.current) textRef.current.value = value
    if (colorRef.current && document.activeElement !== colorRef.current) colorRef.current.value = hex
  }, [value, hex])

  const handleCopy = () => {
    navigator.clipboard.writeText(hex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleColorChange = (h: string) => {
    const apply = () => {
      const replaced = value.replace(/\[#[0-9a-fA-F]{3,6}\]/, `[${h}]`)
      if (replaced !== value) {
        onChange(replaced)
      } else {
        const detectedPrefix = value.match(/^(text|bg|border)-/)?.[0] ?? prefix
        onChange(`${detectedPrefix}[${h}]`)
      }
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(apply, 300)
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={colorRef}
        type="color"
        defaultValue={hex}
        onChange={(e) => handleColorChange(e.target.value)}
        className="w-6 h-6 rounded border border-border-subtle cursor-pointer shrink-0 bg-transparent"
      />
      <input
        ref={textRef}
        type="text"
        defaultValue={value}
        onChange={(e) => { if (timerRef.current) clearTimeout(timerRef.current); timerRef.current = setTimeout(() => onChange(e.target.value), 300) }}
        onBlur={(e) => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null } onChange(e.target.value) }}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
        placeholder="text-gray-500 or [#hex]"
        className="flex-1 text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary outline-none focus:border-forge-terracotta font-mono"
      />
      <button
        onClick={handleCopy}
        className="shrink-0 text-text-muted/50 hover:text-text-secondary transition cursor-pointer"
        title={hex}
      >
        {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
      </button>
    </div>
  )
}

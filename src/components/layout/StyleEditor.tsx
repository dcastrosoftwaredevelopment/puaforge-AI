import { useState } from 'react'
import { ChevronDown, ChevronRight, X, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStyleEditor } from '@/hooks/useStyleEditor'
import {
  FONT_SIZES, FONT_WEIGHTS, TEXT_ALIGNS, DISPLAYS,
  FLEX_DIRS, JUSTIFY, ALIGN_ITEMS, ROUNDED_CLASSES,
  SHADOW_CLASSES, BORDER_WIDTHS, SPACING_SCALE, OVERFLOWS,
} from '@/utils/tailwindClasses'

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border-subtle/50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-medium text-text-muted uppercase tracking-wide hover:text-text-secondary transition cursor-pointer"
      >
        {title}
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </button>
      {open && <div className="px-3 pb-3 flex flex-col gap-2">{children}</div>}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-text-muted/70 w-20 shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<string | { label: string; value: string }> }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary focus:outline-none focus:border-forge-terracotta cursor-pointer"
    >
      <option value="" />
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value
        const label = typeof opt === 'string' ? opt : opt.label
        return <option key={val} value={val}>{label}</option>
      })}
    </select>
  )
}

function ColorInput({ value, onChange, prefix = '' }: { value: string; onChange: (v: string) => void; prefix?: string }) {
  const hexMatch = value.match(/\[#([0-9a-fA-F]{3,6})\]/)
  const hex = hexMatch ? `#${hexMatch[1]}` : '#000000'
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        value={hex}
        onChange={(e) => {
          const h = e.target.value
          const replaced = value.replace(/\[#[0-9a-fA-F]{3,6}\]/, `[${h}]`)
          if (replaced !== value) {
            onChange(replaced)
          } else {
            // value is a named class (e.g. text-gray-500) — detect prefix or fall back to prop
            const detectedPrefix = value.match(/^(text|bg|border)-/)?.[0] ?? prefix
            onChange(`${detectedPrefix}[${h}]`)
          }
        }}
        className="w-6 h-6 rounded border border-border-subtle cursor-pointer shrink-0 bg-transparent"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="text-gray-500 or [#hex]"
        className="flex-1 text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary outline-none focus:border-forge-terracotta font-mono"
      />
    </div>
  )
}

function SpacingInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
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

// ── Main component ────────────────────────────────────────────────────────────

export default function StyleEditor() {
  const { t } = useTranslation()
  const { selectedElement, parsed, parsedInlineStyle, applyClass, removeOneClass, addOneClass, removeCategory, setInlineProp, removeInlineProp, addInlineProp } = useStyleEditor()
  const [newClass, setNewClass] = useState('')
  const [newInlineProp, setNewInlineProp] = useState('')
  const [newInlineValue, setNewInlineValue] = useState('')

  if (!selectedElement || !parsed) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-text-muted/50 px-4 text-center">
        {t('inspect.styleEditorEmpty')}
      </div>
    )
  }

  const allClasses = selectedElement.className.split(/\s+/).filter(Boolean)
  const unknownClasses = parsed.unknown

  return (
    <div className="flex flex-col h-full overflow-y-auto text-xs">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border-subtle flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-mono bg-forge-terracotta/10 text-forge-terracotta border border-forge-terracotta/20 px-1.5 py-0.5 rounded">
          {selectedElement.tagName}
        </span>
      </div>

      {/* Typography */}
      <Section title={t('inspect.sectionTypography')}>
        <Row label={t('inspect.fontSize')}>
          <Select value={parsed.fontSize} onChange={(v) => v ? applyClass(v) : removeCategory(FONT_SIZES[0])} options={FONT_SIZES.map((s) => ({ label: s.replace('text-', ''), value: s }))} />
        </Row>
        <Row label={t('inspect.fontWeight')}>
          <Select value={parsed.fontWeight} onChange={(v) => v ? applyClass(v) : removeCategory(FONT_WEIGHTS[0])} options={FONT_WEIGHTS.map((s) => ({ label: s.replace('font-', ''), value: s }))} />
        </Row>
        <Row label={t('inspect.textAlign')}>
          <div className="flex gap-1">
            {TEXT_ALIGNS.map((cls) => (
              <button
                key={cls}
                onClick={() => applyClass(cls)}
                className={`flex-1 py-1 rounded text-[10px] capitalize border transition cursor-pointer ${parsed.textAlign === cls ? 'border-forge-terracotta text-forge-terracotta bg-forge-terracotta/10' : 'border-border-subtle text-text-muted hover:border-border-default'}`}
              >
                {cls.replace('text-', '')}
              </button>
            ))}
          </div>
        </Row>
        <Row label={t('inspect.textColor')}>
          <ColorInput value={parsed.textColor} onChange={(v) => applyClass(v)} prefix="text-" />
        </Row>
      </Section>

      {/* Colors */}
      <Section title={t('inspect.sectionColors')}>
        <Row label={t('inspect.bgColor')}>
          <ColorInput value={parsed.bgColor} onChange={(v) => applyClass(v)} prefix="bg-" />
        </Row>
      </Section>

      {/* Spacing */}
      <Section title={t('inspect.sectionSpacing')}>
        <span className="text-[10px] text-text-muted/60 uppercase">{t('inspect.padding')}</span>
        <div className="grid grid-cols-2 gap-1">
          <SpacingInput label="T" value={parsed.paddingTop} onChange={(v) => v ? applyClass(`pt-${v}`) : removeCategory('pt-0')} />
          <SpacingInput label="R" value={parsed.paddingRight} onChange={(v) => v ? applyClass(`pr-${v}`) : removeCategory('pr-0')} />
          <SpacingInput label="B" value={parsed.paddingBottom} onChange={(v) => v ? applyClass(`pb-${v}`) : removeCategory('pb-0')} />
          <SpacingInput label="L" value={parsed.paddingLeft} onChange={(v) => v ? applyClass(`pl-${v}`) : removeCategory('pl-0')} />
        </div>
        <span className="text-[10px] text-text-muted/60 uppercase">{t('inspect.margin')}</span>
        <div className="grid grid-cols-2 gap-1">
          <SpacingInput label="T" value={parsed.marginTop} onChange={(v) => v ? applyClass(`mt-${v}`) : removeCategory('mt-0')} />
          <SpacingInput label="R" value={parsed.marginRight} onChange={(v) => v ? applyClass(`mr-${v}`) : removeCategory('mr-0')} />
          <SpacingInput label="B" value={parsed.marginBottom} onChange={(v) => v ? applyClass(`mb-${v}`) : removeCategory('mb-0')} />
          <SpacingInput label="L" value={parsed.marginLeft} onChange={(v) => v ? applyClass(`ml-${v}`) : removeCategory('ml-0')} />
        </div>
      </Section>

      {/* Dimensions */}
      <Section title={t('inspect.sectionDimensions')}>
        <Row label={t('inspect.width')}>
          <input type="text" value={parsed.width} onChange={(e) => e.target.value ? applyClass(`w-${e.target.value}`) : removeCategory('w-0')} placeholder="full / auto / 64" className="w-full text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary outline-none focus:border-forge-terracotta font-mono" />
        </Row>
        <Row label={t('inspect.height')}>
          <input type="text" value={parsed.height} onChange={(e) => e.target.value ? applyClass(`h-${e.target.value}`) : removeCategory('h-0')} placeholder="full / auto / 64" className="w-full text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary outline-none focus:border-forge-terracotta font-mono" />
        </Row>
        <Row label={t('inspect.maxWidth')}>
          <input type="text" value={parsed.maxWidth} onChange={(e) => e.target.value ? applyClass(`max-w-${e.target.value}`) : removeCategory('max-w-sm')} placeholder="sm / lg / xl / full" className="w-full text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary outline-none focus:border-forge-terracotta font-mono" />
        </Row>
      </Section>

      {/* Layout */}
      <Section title={t('inspect.sectionLayout')}>
        <Row label={t('inspect.display')}>
          <Select value={parsed.display} onChange={(v) => v ? applyClass(v) : removeCategory(DISPLAYS[0])} options={DISPLAYS} />
        </Row>
        {(parsed.display === 'flex' || parsed.display === 'inline-flex') && (
          <>
            <Row label={t('inspect.flexDir')}>
              <Select value={parsed.flexDir} onChange={(v) => v ? applyClass(v) : removeCategory(FLEX_DIRS[0])} options={FLEX_DIRS.map((s) => ({ label: s.replace('flex-', ''), value: s }))} />
            </Row>
            <Row label={t('inspect.justify')}>
              <Select value={parsed.justify} onChange={(v) => v ? applyClass(v) : removeCategory(JUSTIFY[0])} options={JUSTIFY.map((s) => ({ label: s.replace('justify-', ''), value: s }))} />
            </Row>
            <Row label={t('inspect.alignItems')}>
              <Select value={parsed.alignItems} onChange={(v) => v ? applyClass(v) : removeCategory(ALIGN_ITEMS[0])} options={ALIGN_ITEMS.map((s) => ({ label: s.replace('items-', ''), value: s }))} />
            </Row>
            <Row label={t('inspect.gap')}>
              <Select value={parsed.gap} onChange={(v) => v ? applyClass(`gap-${v}`) : removeCategory('gap-0')} options={SPACING_SCALE.map((n) => String(n))} />
            </Row>
          </>
        )}
      </Section>

      {/* Border */}
      <Section title={t('inspect.sectionBorder')}>
        <Row label={t('inspect.rounded')}>
          <Select value={parsed.rounded} onChange={(v) => v ? applyClass(v) : removeCategory(ROUNDED_CLASSES[0])} options={ROUNDED_CLASSES} />
        </Row>
        <Row label={t('inspect.borderWidth')}>
          <Select value={parsed.borderWidth} onChange={(v) => v ? applyClass(v) : removeCategory(BORDER_WIDTHS[0])} options={BORDER_WIDTHS} />
        </Row>
        {parsed.borderWidth && parsed.borderWidth !== 'border-0' && (
          <Row label={t('inspect.borderColor')}>
            <ColorInput value={parsed.borderColor} onChange={(v) => applyClass(v)} prefix="border-" />
          </Row>
        )}
      </Section>

      {/* Effects */}
      <Section title={t('inspect.sectionEffects')}>
        <Row label={t('inspect.shadow')}>
          <Select value={parsed.shadow} onChange={(v) => v ? applyClass(v) : removeCategory(SHADOW_CLASSES[0])} options={SHADOW_CLASSES} />
        </Row>
        <Row label={t('inspect.opacity')}>
          <input type="range" min={0} max={100} step={5} value={parsed.opacity || '100'} onChange={(e) => applyClass(`opacity-${e.target.value}`)} className="w-full accent-forge-terracotta cursor-pointer" />
        </Row>
        <Row label={t('inspect.overflow')}>
          <Select value={parsed.overflow} onChange={(v) => v ? applyClass(v) : removeCategory(OVERFLOWS[0])} options={OVERFLOWS} />
        </Row>
      </Section>

      {/* Inline styles */}
      {(selectedElement.inlineStyle || Object.keys(parsedInlineStyle).length > 0) && (
        <Section title={t('inspect.sectionInlineStyles')} defaultOpen={true}>
          {Object.entries(parsedInlineStyle).map(([prop, value]) => (
            <Row key={prop} label={prop}>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setInlineProp(prop, e.target.value)}
                  onBlur={(e) => { if (!e.target.value) removeInlineProp(prop) }}
                  className="flex-1 text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary outline-none focus:border-forge-terracotta font-mono"
                />
                <button
                  onClick={() => removeInlineProp(prop)}
                  className="shrink-0 text-text-muted/50 hover:text-red-400 transition cursor-pointer px-1"
                >
                  <X size={10} />
                </button>
              </div>
            </Row>
          ))}
          <div className="flex gap-1 mt-1">
            <input
              type="text"
              value={newInlineProp}
              onChange={(e) => setNewInlineProp(e.target.value)}
              placeholder={t('inspect.inlineStyleAddProp')}
              className="w-24 shrink-0 text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary outline-none focus:border-forge-terracotta font-mono"
            />
            <input
              type="text"
              value={newInlineValue}
              onChange={(e) => setNewInlineValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newInlineProp.trim()) {
                  addInlineProp(newInlineProp, newInlineValue)
                  setNewInlineProp('')
                  setNewInlineValue('')
                }
              }}
              placeholder={t('inspect.inlineStyleAddValue')}
              className="flex-1 text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary outline-none focus:border-forge-terracotta font-mono"
            />
            <button
              onClick={() => {
                if (newInlineProp.trim()) {
                  addInlineProp(newInlineProp, newInlineValue)
                  setNewInlineProp('')
                  setNewInlineValue('')
                }
              }}
              className="px-2 py-1 rounded bg-bg-elevated border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default transition cursor-pointer"
            >
              <Plus size={11} />
            </button>
          </div>
        </Section>
      )}

      {/* Advanced classes */}
      <Section title={t('inspect.sectionAdvanced')} defaultOpen={false}>
        <div className="flex flex-wrap gap-1 min-h-6">
          {allClasses.map((cls) => (
            <span
              key={cls}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono border ${unknownClasses.includes(cls) ? 'border-border-default text-text-secondary bg-bg-elevated' : 'border-border-subtle text-text-muted bg-bg-secondary'}`}
            >
              {cls}
              <button onClick={() => removeOneClass(cls)} className="text-text-muted/50 hover:text-red-400 transition cursor-pointer">
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            type="text"
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && newClass.trim()) { addOneClass(newClass.trim()); setNewClass('') } }}
            placeholder={t('inspect.addClassPlaceholder')}
            className="flex-1 text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary outline-none focus:border-forge-terracotta font-mono"
          />
          <button
            onClick={() => { if (newClass.trim()) { addOneClass(newClass.trim()); setNewClass('') } }}
            className="px-2 py-1 rounded bg-bg-elevated border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default transition cursor-pointer"
          >
            <Plus size={11} />
          </button>
        </div>
      </Section>
    </div>
  )
}

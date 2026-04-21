// Category matchers — each entry describes a group of mutually-exclusive Tailwind classes.
// When the user applies a class from a category, all other classes in that category are removed first.

export const FONT_SIZES = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl']
export const FONT_WEIGHTS = ['font-thin', 'font-extralight', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black']
export const TEXT_ALIGNS = ['text-left', 'text-center', 'text-right', 'text-justify']
export const DISPLAYS = ['block', 'flex', 'grid', 'hidden', 'inline', 'inline-flex', 'inline-grid', 'inline-block']
export const FLEX_DIRS = ['flex-row', 'flex-col', 'flex-row-reverse', 'flex-col-reverse']
export const JUSTIFY = ['justify-start', 'justify-end', 'justify-center', 'justify-between', 'justify-around', 'justify-evenly']
export const ALIGN_ITEMS = ['items-start', 'items-end', 'items-center', 'items-baseline', 'items-stretch']
export const OVERFLOWS = ['overflow-hidden', 'overflow-auto', 'overflow-visible', 'overflow-scroll']
export const ROUNDED_CLASSES = ['rounded-none', 'rounded-sm', 'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-3xl', 'rounded-full']
export const SHADOW_CLASSES = ['shadow-none', 'shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-inner']

export const SPACING_SCALE = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96]
export const BORDER_WIDTHS = ['border-0', 'border', 'border-2', 'border-4', 'border-8']
export const OPACITY_VALUES = [0, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 100]

// Sets for O(1) membership checks
const FONT_SIZE_SET = new Set(FONT_SIZES)
const FONT_WEIGHT_SET = new Set(FONT_WEIGHTS)
const TEXT_ALIGN_SET = new Set(TEXT_ALIGNS)
const DISPLAY_SET = new Set(DISPLAYS)
const FLEX_DIR_SET = new Set(FLEX_DIRS)
const JUSTIFY_SET = new Set(JUSTIFY)
const ALIGN_SET = new Set(ALIGN_ITEMS)
const OVERFLOW_SET = new Set(OVERFLOWS)
const ROUNDED_SET = new Set(ROUNDED_CLASSES)
const SHADOW_SET = new Set(SHADOW_CLASSES)
const BORDER_WIDTH_SET = new Set(BORDER_WIDTHS)

export interface ParsedClasses {
  fontSize: string
  fontWeight: string
  textAlign: string
  textColor: string
  bgColor: string
  paddingTop: string
  paddingRight: string
  paddingBottom: string
  paddingLeft: string
  marginTop: string
  marginRight: string
  marginBottom: string
  marginLeft: string
  width: string
  height: string
  maxWidth: string
  display: string
  flexDir: string
  justify: string
  alignItems: string
  gap: string
  rounded: string
  borderWidth: string
  borderColor: string
  shadow: string
  opacity: string
  overflow: string
  unknown: string[] // classes not recognized by the parser
}

function getSpacingVal(cls: string, prefix: string): string {
  if (cls.startsWith(prefix)) return cls.slice(prefix.length)
  return ''
}

// Returns the Tailwind class for a specific shorthand property (px/py/p/m/mx/my applied to individual sides)
function expandShorthands(classes: string[]): Map<string, string> {
  const sides: Map<string, string> = new Map()
  // Process from general to specific so specific overrides general
  for (const cls of classes) {
    if (/^p-/.test(cls)) {
      const v = cls.slice(2); ['pt', 'pr', 'pb', 'pl'].forEach((s) => sides.set(s, v))
    } else if (/^px-/.test(cls)) {
      const v = cls.slice(3); ['pr', 'pl'].forEach((s) => sides.set(s, v))
    } else if (/^py-/.test(cls)) {
      const v = cls.slice(3); ['pt', 'pb'].forEach((s) => sides.set(s, v))
    } else if (/^m-/.test(cls)) {
      const v = cls.slice(2); ['mt', 'mr', 'mb', 'ml'].forEach((s) => sides.set(s, v))
    } else if (/^mx-/.test(cls)) {
      const v = cls.slice(3); ['mr', 'ml'].forEach((s) => sides.set(s, v))
    } else if (/^my-/.test(cls)) {
      const v = cls.slice(3); ['mt', 'mb'].forEach((s) => sides.set(s, v))
    } else if (/^pt-/.test(cls)) sides.set('pt', cls.slice(3))
    else if (/^pr-/.test(cls)) sides.set('pr', cls.slice(3))
    else if (/^pb-/.test(cls)) sides.set('pb', cls.slice(3))
    else if (/^pl-/.test(cls)) sides.set('pl', cls.slice(3))
    else if (/^mt-/.test(cls)) sides.set('mt', cls.slice(3))
    else if (/^mr-/.test(cls)) sides.set('mr', cls.slice(3))
    else if (/^mb-/.test(cls)) sides.set('mb', cls.slice(3))
    else if (/^ml-/.test(cls)) sides.set('ml', cls.slice(3))
  }
  return sides
}

export function parseClasses(className: string): ParsedClasses {
  const classes = className.split(/\s+/).filter(Boolean)
  const sides = expandShorthands(classes)
  const parsed: ParsedClasses = {
    fontSize: '', fontWeight: '', textAlign: '', textColor: '', bgColor: '',
    paddingTop: sides.get('pt') ?? '',
    paddingRight: sides.get('pr') ?? '',
    paddingBottom: sides.get('pb') ?? '',
    paddingLeft: sides.get('pl') ?? '',
    marginTop: sides.get('mt') ?? '',
    marginRight: sides.get('mr') ?? '',
    marginBottom: sides.get('mb') ?? '',
    marginLeft: sides.get('ml') ?? '',
    width: '', height: '', maxWidth: '', display: '', flexDir: '', justify: '',
    alignItems: '', gap: '', rounded: '', borderWidth: '', borderColor: '',
    shadow: '', opacity: '', overflow: '', unknown: [],
  }

  const SPACING_PREFIXES = /^(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml)-/

  for (const cls of classes) {
    if (SPACING_PREFIXES.test(cls)) continue // already handled above
    if (FONT_SIZE_SET.has(cls)) { parsed.fontSize = cls; continue }
    if (FONT_WEIGHT_SET.has(cls)) { parsed.fontWeight = cls; continue }
    if (TEXT_ALIGN_SET.has(cls)) { parsed.textAlign = cls; continue }
    if (DISPLAY_SET.has(cls)) { parsed.display = cls; continue }
    if (FLEX_DIR_SET.has(cls)) { parsed.flexDir = cls; continue }
    if (JUSTIFY_SET.has(cls)) { parsed.justify = cls; continue }
    if (ALIGN_SET.has(cls)) { parsed.alignItems = cls; continue }
    if (OVERFLOW_SET.has(cls)) { parsed.overflow = cls; continue }
    if (ROUNDED_SET.has(cls)) { parsed.rounded = cls; continue }
    if (SHADOW_SET.has(cls)) { parsed.shadow = cls; continue }
    if (BORDER_WIDTH_SET.has(cls)) { parsed.borderWidth = cls; continue }
    if (/^w-/.test(cls)) { parsed.width = getSpacingVal(cls, 'w-'); continue }
    if (/^h-/.test(cls)) { parsed.height = getSpacingVal(cls, 'h-'); continue }
    if (/^max-w-/.test(cls)) { parsed.maxWidth = getSpacingVal(cls, 'max-w-'); continue }
    if (/^gap-/.test(cls)) { parsed.gap = getSpacingVal(cls, 'gap-'); continue }
    if (/^opacity-/.test(cls)) { parsed.opacity = getSpacingVal(cls, 'opacity-'); continue }
    if (/^text-/.test(cls)) { parsed.textColor = cls; continue } // after size/align checks
    if (/^bg-/.test(cls)) { parsed.bgColor = cls; continue }
    if (/^border-[A-Za-z]/.test(cls)) { parsed.borderColor = cls; continue }
    parsed.unknown.push(cls)
  }

  return parsed
}

const CATEGORY_SETS: Array<Set<string> | RegExp> = [
  FONT_SIZE_SET, FONT_WEIGHT_SET, TEXT_ALIGN_SET, DISPLAY_SET,
  FLEX_DIR_SET, JUSTIFY_SET, ALIGN_SET, OVERFLOW_SET, ROUNDED_SET,
  SHADOW_SET, BORDER_WIDTH_SET,
  /^text-/, /^bg-/, /^w-/, /^h-/, /^max-w-/, /^gap-/,
  /^opacity-/, /^border-[A-Za-z]/, /^p-/, /^px-/, /^py-/,
  /^pt-/, /^pr-/, /^pb-/, /^pl-/, /^m-/, /^mx-/, /^my-/,
  /^mt-/, /^mr-/, /^mb-/, /^ml-/,
]

function sameCategory(a: string, b: string): boolean {
  for (const cat of CATEGORY_SETS) {
    if (cat instanceof Set) {
      if (cat.has(a) && cat.has(b)) return true
    } else {
      if (cat.test(a) && cat.test(b)) return true
    }
  }
  return false
}

/** Remove all classes in the same category as `newClass`, then append `newClass`. */
export function replaceClass(className: string, newClass: string): string {
  const classes = className.split(/\s+/).filter(Boolean)
  const filtered = classes.filter((c) => !sameCategory(c, newClass))
  if (!newClass) return filtered.join(' ')
  return [...filtered, newClass].join(' ')
}

/** Remove all classes in the same category as `representative` (use any member of the category). */
export function removeClassCategory(className: string, representative: string): string {
  if (!representative) return className
  return className.split(/\s+/).filter(Boolean).filter((c) => !sameCategory(c, representative)).join(' ')
}

/** Remove a specific class from the className string. */
export function removeClass(className: string, cls: string): string {
  return className.split(/\s+/).filter((c) => c !== cls).join(' ')
}

/** Add a class if not present. */
export function addClass(className: string, cls: string): string {
  const classes = className.split(/\s+/).filter(Boolean)
  if (classes.includes(cls)) return className
  return [...classes, cls].join(' ')
}

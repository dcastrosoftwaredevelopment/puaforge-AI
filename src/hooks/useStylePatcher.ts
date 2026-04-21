import { useCallback, useEffect, useRef } from 'react'
import { useStore, useSetAtom } from 'jotai'
import { useSandpack } from '@codesandbox/sandpack-react'
import { filesAtom } from '@/atoms'
import { toJSXStyleObject } from '@/utils/inlineStyles'

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function patchCode(code: string, oldClass: string, newClass: string): string {
  const esc = escapeRegex(oldClass)
  const replace = (_m: string, p1: string, p2: string) => `${p1}${newClass}${p2}`
  return code
    .replace(new RegExp(`(className=")${esc}(")`, 'g'), replace)
    .replace(new RegExp(`(className={'")${esc}("'})`, 'g'), replace)
}

function patchInlineStyle(code: string, oldStyle: string, newStyle: string): string {
  // Pattern 1: style="old"
  const esc = escapeRegex(oldStyle)
  const patched1 = code.replace(new RegExp(`style="${esc}"`, 'g'), `style="${newStyle}"`)
  if (patched1 !== code) return patched1

  // Pattern 2: style={{ ... }} — replace the whole JSX object
  const jsxObj = toJSXStyleObject(newStyle)
  const patched2 = code.replace(/style=\{\{[^}]*\}\}/g, `style={${jsxObj}}`)
  return patched2
}

const DEBOUNCE_MS = 500

export function useStylePatcher() {
  const { sandpack } = useSandpack()
  const store = useStore()
  const setFiles = useSetAtom(filesAtom)
  // filesRef is updated directly on each patch — no atom subscription to avoid re-renders
  const filesRef = useRef(store.get(filesAtom))
  const pendingRef = useRef<Map<string, string>>(new Map())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync filesRef when atom changes from external sources (AI code gen, file save, etc.)
  useEffect(() => {
    return store.sub(filesAtom, () => {
      filesRef.current = store.get(filesAtom)
    })
  }, [store])

  const flushToSandpack = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const entries = [...pendingRef.current.entries()]
      pendingRef.current.clear()
      if (entries.length === 0) return
      for (const [path, code] of entries) sandpack.updateFile(path, code)
      setFiles((prev) => {
        const next = { ...prev }
        for (const [path, code] of entries) next[path] = code
        return next
      })
    }, DEBOUNCE_MS)
  }, [sandpack, setFiles])

  const commitUpdates = useCallback((updates: Array<[string, string]>) => {
    const next = { ...filesRef.current }
    for (const [path, patched] of updates) {
      next[path] = patched
      pendingRef.current.set(path, patched)
    }
    filesRef.current = next
    flushToSandpack()
  }, [flushToSandpack])

  const applyClassChange = useCallback((oldClassName: string, newClassName: string) => {
    const updates: Array<[string, string]> = []
    for (const [path, code] of Object.entries(filesRef.current)) {
      const patched = patchCode(code, oldClassName, newClassName)
      if (patched !== code) updates.push([path, patched])
    }
    if (updates.length > 0) commitUpdates(updates)
  }, [commitUpdates])

  const applyInlineStyleChange = useCallback((oldStyle: string, newStyle: string) => {
    if (oldStyle === newStyle) return
    const updates: Array<[string, string]> = []
    for (const [path, code] of Object.entries(filesRef.current)) {
      const patched = patchInlineStyle(code, oldStyle, newStyle)
      if (patched !== code) updates.push([path, patched])
    }
    if (updates.length > 0) commitUpdates(updates)
  }, [commitUpdates])

  return { applyClassChange, applyInlineStyleChange }
}

import { useCallback, useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
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

export function useStylePatcher() {
  const { sandpack } = useSandpack()
  const [files, setFiles] = useAtom(filesAtom)
  const filesRef = useRef(files)

  useEffect(() => { filesRef.current = files }, [files])

  const applyClassChange = useCallback((oldClassName: string, newClassName: string) => {
    const current = filesRef.current
    const updates: Array<[string, string]> = []

    for (const [path, code] of Object.entries(current)) {
      const patched = patchCode(code, oldClassName, newClassName)
      if (patched !== code) updates.push([path, patched])
    }

    if (updates.length === 0) return

    for (const [path, patched] of updates) {
      sandpack.updateFile(path, patched)
    }

    setFiles((prev) => {
      const next = { ...prev }
      for (const [path, patched] of updates) next[path] = patched
      return next
    })
  }, [sandpack, setFiles])

  const applyInlineStyleChange = useCallback((oldStyle: string, newStyle: string) => {
    if (oldStyle === newStyle) return
    const current = filesRef.current
    const updates: Array<[string, string]> = []

    for (const [path, code] of Object.entries(current)) {
      const patched = patchInlineStyle(code, oldStyle, newStyle)
      if (patched !== code) updates.push([path, patched])
    }

    if (updates.length === 0) return

    for (const [path, patched] of updates) {
      sandpack.updateFile(path, patched)
    }

    setFiles((prev) => {
      const next = { ...prev }
      for (const [path, patched] of updates) next[path] = patched
      return next
    })
  }, [sandpack, setFiles])

  return { applyClassChange, applyInlineStyleChange }
}

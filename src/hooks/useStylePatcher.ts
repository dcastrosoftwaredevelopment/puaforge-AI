import { useCallback, useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import { useSandpack } from '@codesandbox/sandpack-react'
import { filesAtom } from '@/atoms'

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

  return { applyClassChange }
}

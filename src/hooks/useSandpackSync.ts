import { useCallback, useEffect, useRef } from 'react'
import { useSandpack } from '@codesandbox/sandpack-react'
import { useFiles } from './useFiles'
import { useEditorState } from './useEditorState'

/**
 * Syncs filesAtom changes into Sandpack's internal state.
 * Provides save/discard for user manual edits.
 * Must be rendered inside <SandpackProvider>.
 */
export function useSandpackSync() {
  const { files, setFiles } = useFiles()
  const { sandpack } = useSandpack()
  const { setDirty } = useEditorState()
  const sandpackRef = useRef(sandpack)
  sandpackRef.current = sandpack
  const prevFilesRef = useRef(files)
  const isFirstRunRef = useRef(true)

  // Push atom changes → Sandpack (skip first run, Provider already has correct files)
  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false
      return
    }

    const sp = sandpackRef.current
    const prevFiles = prevFilesRef.current
    prevFilesRef.current = files

    const currentPaths = new Set(Object.keys(files))
    for (const path of Object.keys(prevFiles)) {
      if (!currentPaths.has(path) && path !== '/index.html') {
        sp.deleteFile(path)
      }
    }

    for (const [path, code] of Object.entries(files)) {
      sp.updateFile(path, code)
    }

    setDirty(false)
  }, [files, setDirty])

  // Mark dirty when user types in editor — poll on interval (lightweight)
  useEffect(() => {
    const interval = setInterval(() => {
      const spFiles = sandpackRef.current.files
      for (const [path, file] of Object.entries(spFiles)) {
        if (path === '/index.html' || path === '/package.json') continue
        const code = typeof file === 'string' ? file : file.code
        if (prevFilesRef.current[path] !== undefined && prevFilesRef.current[path] !== code) {
          setDirty(true)
          return
        }
      }
    }, 500)
    return () => clearInterval(interval)
  }, [setDirty])

  // Save: read all files from Sandpack → update atoms
  const saveEdits = useCallback(() => {
    const spFiles = sandpackRef.current.files
    const updated: Record<string, string> = {}

    for (const [path, file] of Object.entries(spFiles)) {
      if (path === '/index.html' || path === '/package.json') continue
      const code = typeof file === 'string' ? file : file.code
      updated[path] = code
    }

    setFiles(updated)
    setDirty(false)
  }, [setFiles, setDirty])

  // Discard: reset Sandpack to atom state
  const discardEdits = useCallback(() => {
    const sp = sandpackRef.current
    for (const [path, code] of Object.entries(prevFilesRef.current)) {
      sp.updateFile(path, code)
    }
    setDirty(false)
  }, [setDirty])

  return { saveEdits, discardEdits }
}

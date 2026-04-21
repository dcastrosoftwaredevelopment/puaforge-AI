import { useCallback, useEffect, useRef } from 'react'
import { useSetAtom } from 'jotai'
import { useSandpack } from '@codesandbox/sandpack-react'
import { editorActionsAtom } from '@/atoms'
import { useFiles } from './useFiles'
import { useEditorState } from './useEditorState'

/**
 * Syncs filesAtom changes into Sandpack's internal state.
 * Registers save/discard actions via atom for external consumption.
 * Must be rendered inside <SandpackProvider>.
 */
export function useSandpackSync() {
  const { files, setFiles } = useFiles()
  const { sandpack } = useSandpack()
  const { isDirty, setDirty } = useEditorState()
  const setActions = useSetAtom(editorActionsAtom)
  const sandpackRef = useRef(sandpack)
  const prevFilesRef = useRef(files)
  const isFirstRunRef = useRef(true)
  const isDirtyRef = useRef(isDirty)

  useEffect(() => { sandpackRef.current = sandpack })
  useEffect(() => { isDirtyRef.current = isDirty })

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

  // Detect user edits — poll using refs to avoid re-renders when already dirty
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirtyRef.current) return
      const spFiles = sandpackRef.current.files
      for (const [path, file] of Object.entries(spFiles)) {
        if (path === '/index.html' || path === '/package.json') continue
        if (typeof file === 'object' && file.hidden) continue
        const code = typeof file === 'string' ? file : file.code
        if (prevFilesRef.current[path] !== undefined && prevFilesRef.current[path] !== code) {
          setDirty(true)
          return
        }
      }
    }, 800)
    return () => clearInterval(interval)
  }, [setDirty])

  // Save: read all files from Sandpack → update atoms
  const saveEdits = useCallback(() => {
    const spFiles = sandpackRef.current.files
    const updated: Record<string, string> = {}

    for (const [path, file] of Object.entries(spFiles)) {
      if (path === '/index.html' || path === '/package.json') continue
      if (typeof file === 'object' && file.hidden) continue
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

  // Register actions so other components can call save/discard without useSandpack()
  useEffect(() => {
    setActions({ save: saveEdits, discard: discardEdits })
  }, [saveEdits, discardEdits, setActions])
}

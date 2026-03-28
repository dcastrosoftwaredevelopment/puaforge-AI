import { useEffect, useRef } from 'react'
import { useSandpack } from '@codesandbox/sandpack-react'
import { useFiles } from './useFiles'

/**
 * Syncs filesAtom changes into Sandpack's internal state.
 * Handles both file additions/updates and deletions.
 * Must be rendered inside <SandpackProvider>.
 */
export function useSandpackSync() {
  const { files } = useFiles()
  const { sandpack } = useSandpack()
  const sandpackRef = useRef(sandpack)
  sandpackRef.current = sandpack
  const prevFilesRef = useRef(files)

  useEffect(() => {
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
  }, [files])
}

import { useEffect, useRef } from 'react'
import { useSandpack } from '@codesandbox/sandpack-react'
import { useFiles } from './useFiles'

/**
 * Syncs filesAtom changes into Sandpack's internal state.
 * Must be rendered inside <SandpackProvider>.
 */
export function useSandpackSync() {
  const { files } = useFiles()
  const { sandpack } = useSandpack()
  const sandpackRef = useRef(sandpack)
  sandpackRef.current = sandpack

  useEffect(() => {
    const sp = sandpackRef.current
    for (const [path, code] of Object.entries(files)) {
      sp.updateFile(path, code)
    }
  }, [files])
}

import { useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { useSandpackClient } from '@codesandbox/sandpack-react'
import {
  selectedElementAtom,
  hoveredElementAtom,
  domTreeAtom,
  editorPanelModeAtom,
  type SelectedElement,
  type DOMNode,
} from '@/atoms'

/**
 * Bridges postMessage traffic between the platform and the Sandpack preview iframe.
 * Must be called exactly ONCE, inside SandpackProvider (via SandpackSyncBridge).
 *
 * Outbound (platform → iframe): listens for CustomEvents dispatched anywhere on window.
 * Inbound (iframe → platform): listens for window.message events from the preview.
 */
export function useInspectBridge() {
  const { iframe } = useSandpackClient()
  const setSelected = useSetAtom(selectedElementAtom)
  const setHovered = useSetAtom(hoveredElementAtom)
  const setDomTree = useSetAtom(domTreeAtom)
  const setPanelMode = useSetAtom(editorPanelModeAtom)

  const post = (msg: object) =>
    iframe.current?.contentWindow?.postMessage(msg, '*')

  // Forward platform CustomEvents → iframe postMessages
  useEffect(() => {
    const onToggle = (e: Event) => post({ type: 'VIBE_INSPECT_TOGGLE', enabled: (e as CustomEvent).detail.enabled })
    const onSelectById = (e: Event) => post({ type: 'VIBE_SELECT_BY_ID', id: (e as CustomEvent).detail.id })
    const onHoverById = (e: Event) => post({ type: 'VIBE_HOVER_BY_ID', id: (e as CustomEvent).detail.id })
    const onRefreshTree = () => post({ type: 'VIBE_REFRESH_TREE' })

    window.addEventListener('vibe-inspect-toggle', onToggle)
    window.addEventListener('vibe-select-by-id', onSelectById)
    window.addEventListener('vibe-hover-by-id', onHoverById)
    window.addEventListener('vibe-refresh-tree', onRefreshTree)

    return () => {
      window.removeEventListener('vibe-inspect-toggle', onToggle)
      window.removeEventListener('vibe-select-by-id', onSelectById)
      window.removeEventListener('vibe-hover-by-id', onHoverById)
      window.removeEventListener('vibe-refresh-tree', onRefreshTree)
    }
  }, []) // stable — closes over iframe ref, which is a stable ref object

  // Receive iframe → platform messages
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return
      const { type } = e.data

      if (type === 'VIBE_ELEMENT_SELECTED') {
        const el: SelectedElement = { id: e.data.id, tagName: e.data.tagName, className: e.data.className, rect: e.data.rect }
        setSelected(el)
        setPanelMode('style')
      } else if (type === 'VIBE_ELEMENT_HOVERED') {
        const el: SelectedElement = { id: e.data.id, tagName: e.data.tagName, className: e.data.className, rect: e.data.rect }
        setHovered(el)
      } else if (type === 'VIBE_DOM_TREE') {
        setDomTree(e.data.tree as DOMNode[])
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [setSelected, setHovered, setDomTree, setPanelMode])
}

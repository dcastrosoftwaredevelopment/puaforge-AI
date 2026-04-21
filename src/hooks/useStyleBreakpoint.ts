import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { styleBreakpointAtom, devicePreviewAtom, type StyleBreakpoint } from '@/atoms'

const DEVICE_TO_BREAKPOINT: Record<string, StyleBreakpoint> = {
  desktop: 'desktop',
  tablet: 'tablet',
  mobile: 'mobile',
}

const PREFIX_MAP: Record<StyleBreakpoint, string> = {
  mobile: '',
  tablet: 'md',
  desktop: 'lg',
}

export function useStyleBreakpoint() {
  const [breakpoint, setBreakpoint] = useAtom(styleBreakpointAtom)
  const [devicePreview] = useAtom(devicePreviewAtom)

  useEffect(() => {
    setBreakpoint(DEVICE_TO_BREAKPOINT[devicePreview])
  }, [devicePreview, setBreakpoint])

  const prefix = PREFIX_MAP[breakpoint]
  return { breakpoint, setBreakpoint, prefix }
}

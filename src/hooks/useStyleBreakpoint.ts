import { useAtom } from 'jotai';
import { styleBreakpointAtom, PREFIX_MAP } from '@/atoms';

export function useStyleBreakpoint() {
  const [breakpoint, setBreakpoint] = useAtom(styleBreakpointAtom);
  const prefix = PREFIX_MAP[breakpoint];
  return { breakpoint, setBreakpoint, prefix };
}

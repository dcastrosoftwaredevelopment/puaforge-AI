import { useAtom } from 'jotai';
import { devicePreviewAtom } from '@/atoms';

export function useDevicePreview() {
  const [device, setDevice] = useAtom(devicePreviewAtom);

  return { device, setDevice };
}

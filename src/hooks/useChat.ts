import { useAtom, useAtomValue } from 'jotai';
import { isChatOpenAtom, chatModeAtom } from '@/atoms';

export function useChat() {
  const [isOpen, setIsOpen] = useAtom(isChatOpenAtom);
  const [mode, setMode] = useAtom(chatModeAtom);

  return { isOpen, setIsOpen, mode, setMode };
}

export function useChatMode() {
  return useAtomValue(chatModeAtom);
}

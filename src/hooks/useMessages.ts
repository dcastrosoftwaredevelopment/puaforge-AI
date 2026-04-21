import { useAtom, useAtomValue } from 'jotai';
import { messagesAtom, isGeneratingAtom } from '@/atoms';

export function useMessages() {
  const [messages, setMessages] = useAtom(messagesAtom);
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);

  return { messages, setMessages, isGenerating, setIsGenerating };
}

export function useMessagesValue() {
  const messages = useAtomValue(messagesAtom);
  const isGenerating = useAtomValue(isGeneratingAtom);

  return { messages, isGenerating };
}

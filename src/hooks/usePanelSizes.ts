import { useAtom } from 'jotai';
import { editorFractionAtom, chatWidthAtom } from '@/atoms';

const EDITOR_DEFAULT = 0.3;
const CHAT_DEFAULT = 384;

export function usePanelSizes() {
  const [editorFraction, setEditorFraction] = useAtom(editorFractionAtom);
  const [chatWidth, setChatWidth] = useAtom(chatWidthAtom);

  const resetPanels = () => {
    setEditorFraction(EDITOR_DEFAULT);
    setChatWidth(CHAT_DEFAULT);
  };

  return { editorFraction, setEditorFraction, chatWidth, setChatWidth, resetPanels };
}

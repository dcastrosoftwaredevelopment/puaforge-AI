import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMessages } from '@/hooks/useMessages';
import { useFiles } from '@/hooks/useFiles';
import { useModels } from '@/hooks/useModels';
import { useApiKey } from '@/hooks/useApiKey';
import { useProjectImages } from '@/hooks/useProjectImages';
import { useColorPalette } from '@/hooks/useColorPalette';
import { generateCode } from '@/services/aiService';
import { mergeFiles, extractDependencies } from '@/services/fileParser';
import type { MessageImage } from '@/atoms';

export function useMessageSender() {
  const { t } = useTranslation();
  const { messages, setMessages, isGenerating, setIsGenerating } = useMessages();
  const { files, setFiles, setDeps } = useFiles();
  const { selectedModel } = useModels();
  const { effectiveApiKey } = useApiKey();
  const { getImagesContext } = useProjectImages();
  const { getColorsContext } = useColorPalette();

  const sendMessage = useCallback(async (text: string, images?: MessageImage[]) => {
    if ((!text.trim() && !images?.length) || isGenerating) return;

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: images?.length ? (text || t('chat.imageOnly')) : text,
      timestamp: Date.now(),
      images,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      const imagesCtx = getImagesContext();
      const colorsCtx = getColorsContext();
      const baseText = text || t('chat.imageDefaultPrompt');
      const fullPrompt = [baseText, imagesCtx, colorsCtx].filter(Boolean).join('\n\n');

      const result = await generateCode({
        prompt: fullPrompt,
        model: selectedModel,
        currentFiles: files,
        history: messages.map((m) => ({ role: m.role, content: m.content, images: m.images })),
        images,
        apiKey: effectiveApiKey || undefined,
      });

      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.rawResponse,
        timestamp: Date.now(),
      }]);

      if (Object.keys(result.files).length > 0) {
        const merged = mergeFiles(files, result.files);
        setFiles(merged);
        const newDeps = extractDependencies(merged);
        if (Object.keys(newDeps).length > 0) setDeps((prev) => ({ ...prev, ...newDeps }));
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: t('chat.generateError'),
        timestamp: Date.now(),
      }]);
    } finally {
      setIsGenerating(false);
    }
  }, [t, isGenerating, messages, files, selectedModel, effectiveApiKey, getImagesContext, getColorsContext, setMessages, setIsGenerating, setFiles, setDeps]);

  return { sendMessage, isGenerating };
}

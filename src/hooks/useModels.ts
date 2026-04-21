import { useEffect, useRef, useCallback } from 'react';
import { useAtom } from 'jotai';
import { availableModelsAtom, selectedModelAtom } from '@/atoms';
import { useApiKey } from './useApiKey';
import { useApiCall, HttpMethod } from '@/hooks/useApiCall';

export function useModels() {
  const [models, setModels] = useAtom(availableModelsAtom);
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom);
  const { effectiveApiKey } = useApiKey();
  const fetched = useRef(false);

  const { loading, execute: fetchModels } = useApiCall<undefined, { models: { id: string; name: string }[] }>(
    HttpMethod.GET,
    '/api/models',
  );

  const loadModels = useCallback(
    async (key?: string) => {
      const headers: Record<string, string> = {};
      if (key) headers['X-API-Key'] = key;

      const data = await fetchModels(undefined, headers);
      if (!data) return;

      const list = data.models || [];
      setModels(list);
      if (list.length > 0 && !selectedModel) {
        setSelectedModel(list[0].id);
      }
    },
    [fetchModels, setModels, selectedModel, setSelectedModel],
  );

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    loadModels(effectiveApiKey || undefined);
  }, [loadModels, effectiveApiKey]);

  const refetchModels = useCallback(() => {
    loadModels(effectiveApiKey || undefined);
  }, [loadModels, effectiveApiKey]);

  return { models, selectedModel, setSelectedModel, loading, refetchModels };
}

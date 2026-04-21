import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useMemo } from 'react';
import { apiKeyAtom, apiKeyEnabledAtom } from '@/atoms';
import { authTokenAtom } from '@/atoms/authAtoms';
import { api } from '@/services/api';

export function useApiKey() {
  const [apiKey, setApiKey] = useAtom(apiKeyAtom);
  const [apiKeyEnabled, setApiKeyEnabled] = useAtom(apiKeyEnabledAtom);
  const token = useAtomValue(authTokenAtom);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token],
  );

  const saveApiKey = useCallback(
    async (key: string) => {
      setApiKey(key);
      if (authHeaders) {
        await api.post('/api/user/settings', { apiKey: key }, authHeaders);
      }
    },
    [authHeaders, setApiKey],
  );

  const saveApiKeyEnabled = useCallback(
    async (enabled: boolean) => {
      setApiKeyEnabled(enabled);
      if (authHeaders) {
        await api.post('/api/user/settings', { apiKeyEnabled: enabled }, authHeaders);
      }
    },
    [authHeaders, setApiKeyEnabled],
  );

  const effectiveApiKey = apiKey && apiKeyEnabled ? apiKey : '';

  return { apiKey, setApiKey: saveApiKey, apiKeyEnabled, setApiKeyEnabled: saveApiKeyEnabled, effectiveApiKey };
}

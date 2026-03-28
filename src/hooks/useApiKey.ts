import { useAtom } from 'jotai'
import { apiKeyAtom, apiKeyEnabledAtom } from '@/atoms'

export function useApiKey() {
  const [apiKey, setApiKey] = useAtom(apiKeyAtom)
  const [apiKeyEnabled, setApiKeyEnabled] = useAtom(apiKeyEnabledAtom)

  /** Returns the key only if it's configured AND enabled */
  const effectiveApiKey = apiKey && apiKeyEnabled ? apiKey : ''

  return { apiKey, setApiKey, apiKeyEnabled, setApiKeyEnabled, effectiveApiKey }
}

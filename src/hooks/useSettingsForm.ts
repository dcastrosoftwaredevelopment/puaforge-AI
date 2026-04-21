import { useState, useEffect } from 'react';
import { useApiKey } from '@/hooks/useApiKey';
import { useModels } from '@/hooks/useModels';
import { useApiCall, HttpMethod } from '@/hooks/useApiCall';

export function useSettingsForm() {
  const { apiKey, setApiKey, apiKeyEnabled, setApiKeyEnabled } = useApiKey();
  const { refetchModels } = useModels();
  const [draft, setDraft] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [validated, setValidated] = useState<boolean | null>(null);

  useEffect(() => {
    setDraft(apiKey);
  }, [apiKey]);

  const hasChanges = draft !== apiKey;

  const {
    loading: validating,
    error: validationError,
    execute: validateKey,
  } = useApiCall<{ apiKey: string }, { valid: boolean; error?: string }>(HttpMethod.POST, '/api/settings/validate-key');

  const handleValidate = async () => {
    if (!draft.trim()) return;
    setValidated(null);
    const result = await validateKey({ apiKey: draft.trim() });
    setValidated(result ? result.valid : false);
  };

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (trimmed && validated !== true) {
      const result = await validateKey({ apiKey: trimmed });
      const isValid = result ? result.valid : false;
      setValidated(isValid);
      if (!isValid) return;
    }
    setApiKey(trimmed);
    if (trimmed) refetchModels();
    setValidated(null);
  };

  const handleClear = () => {
    setDraft('');
    setApiKey('');
    setApiKeyEnabled(true);
    setValidated(null);
  };

  const handleToggleEnabled = () => {
    setApiKeyEnabled(!apiKeyEnabled);
    refetchModels();
  };

  return {
    apiKey,
    draft,
    setDraft,
    showKey,
    setShowKey,
    validated,
    validating,
    validationError,
    hasChanges,
    apiKeyEnabled,
    handleValidate,
    handleSave,
    handleClear,
    handleToggleEnabled,
  };
}

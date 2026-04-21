import { useState, useCallback } from 'react';
import { api } from '@/services/api';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
}

interface ApiCallState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

export function useApiCall<TBody, TResult>(method: HttpMethod, path: string) {
  const [state, setState] = useState<ApiCallState<TResult>>({
    loading: false,
    error: null,
    data: null,
  });

  const execute = useCallback(
    async (body?: TBody, headers?: Record<string, string>): Promise<TResult | null> => {
      setState({ loading: true, error: null, data: null });
      try {
        const data =
          method === HttpMethod.POST
            ? await api.post<TResult>(path, body, headers)
            : await api.get<TResult>(path, headers);
        setState({ loading: false, error: null, data });
        return data;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Erro desconhecido';
        setState({ loading: false, error, data: null });
        return null;
      }
    },
    [method, path],
  );

  return { ...state, execute };
}

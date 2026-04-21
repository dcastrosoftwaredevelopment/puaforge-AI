import { parseFilesFromResponse } from './fileParser';
import { api } from './api';

interface HistoryImage {
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
}

interface GenerateParams {
  prompt: string;
  model: string;
  currentFiles: Record<string, string>;
  history: { role: 'user' | 'assistant'; content: string; images?: HistoryImage[] }[];
  images?: HistoryImage[];
  apiKey?: string;
}

interface GenerateResult {
  files: Record<string, string>;
  rawResponse: string;
}

export async function generateCode(params: GenerateParams): Promise<GenerateResult> {
  const data = await api.post<{ rawResponse: string }>(
    '/api/generate',
    {
      prompt: params.prompt,
      model: params.model,
      currentFiles: params.currentFiles,
      history: params.history,
      images: params.images,
    },
    params.apiKey ? { 'X-API-Key': params.apiKey } : undefined,
  );

  const rawResponse: string = data.rawResponse || '';
  const files = parseFilesFromResponse(rawResponse);

  return { files, rawResponse };
}

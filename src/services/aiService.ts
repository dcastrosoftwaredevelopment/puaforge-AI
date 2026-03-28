import { parseFilesFromResponse } from './fileParser'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface HistoryImage {
  base64: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
}

interface GenerateParams {
  prompt: string
  model: string
  currentFiles: Record<string, string>
  history: { role: 'user' | 'assistant'; content: string; images?: HistoryImage[] }[]
  images?: HistoryImage[]
  apiKey?: string
}

interface GenerateResult {
  files: Record<string, string>
  rawResponse: string
}

export async function generateCode(params: GenerateParams): Promise<GenerateResult> {
  console.log('[aiService] Sending request to:', `${API_URL}/api/generate`)
  const response = await fetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(params.apiKey ? { 'X-API-Key': params.apiKey } : {}),
    },
    body: JSON.stringify({
      prompt: params.prompt,
      model: params.model,
      currentFiles: params.currentFiles,
      history: params.history,
      images: params.images,
    }),
  })

  console.log('[aiService] Response status:', response.status)
  if (!response.ok) {
    const errorText = await response.text()
    console.error('[aiService] Error:', errorText)
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  console.log('[aiService] Got response, length:', data.rawResponse?.length ?? 0)
  console.log('[aiService] Raw response:', data.rawResponse?.substring(0, 500))
  const rawResponse: string = data.rawResponse || ''
  const files = parseFilesFromResponse(rawResponse)
  console.log('[aiService] Parsed files:', Object.keys(files))

  return { files, rawResponse }
}

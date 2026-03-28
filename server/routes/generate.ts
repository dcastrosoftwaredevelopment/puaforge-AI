import { Router, type Request, type Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { getApiKey } from '../utils/getApiKey.js'

const router = Router()

const SYSTEM_PROMPT = `You are an expert React + TypeScript developer. The user will describe a UI or feature they want.
You must respond with complete file contents using this format:

\`\`\`tsx file="/App.tsx"
// your code here
\`\`\`

Rules:
- Always use TypeScript (.tsx files), never .js or .jsx
- Always return complete files, not partial diffs
- Use Tailwind CSS classes for styling — Tailwind CDN is available via <script> tag
- Prefer Tailwind utility classes over inline styles
- Always use lucide-react for icons (e.g. import { Menu, X, ArrowRight } from 'lucide-react'). Never use other icon libraries.
- Use only React and lucide-react (no other external libraries unless explicitly asked)
- If multiple files are needed, return each in its own fenced block
- CRITICAL: Every file that is imported MUST be included in your response. If a file imports '../components/Foo', you MUST include a code block for that file. Never reference a file without providing its complete implementation.
- IMPORTANT: Only return files that NEED TO CHANGE. Files that are not modified should NOT be included in your response. The system will automatically merge your changes with existing files — unchanged files are preserved.
- Only include /App.tsx if it needs to be modified (e.g. new imports or layout changes)
- When the user asks to update a specific section or component, focus ONLY on that component and any files it directly affects. Do NOT rewrite unrelated components.
- When the user has project images available (listed in the prompt), use them via: import { imageName } from './assets/images'. Use the imported variable as src for <img> tags or in inline styles like backgroundImage: \`url(\${imageName})\`. NEVER modify /assets/images.ts — it is auto-generated.
- ALWAYS use a dark theme with these colors:
  - Backgrounds: bg-[#08080d] (darkest), bg-[#0e0f16] (base), bg-[#151620] (surface), bg-[#1a1b2e] (elevated)
  - Text: text-[#f1f5f9] (headings), text-[#e2e8f0] (body), text-[#94a3b8] (secondary), text-[#64748b] (muted)
  - Accent: text-[#6366f1] / bg-[#6366f1] (primary), hover variants with [#818cf8]
  - Borders: border-[rgba(255,255,255,0.06)] (subtle), border-[rgba(255,255,255,0.1)] (default)
  - Success: text-[#10b981]
  - NEVER use light backgrounds, gradients with purple/blue, or white backgrounds`

interface ImageData {
  base64: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
}

interface GenerateBody {
  prompt: string
  model?: string
  currentFiles: Record<string, string>
  history: { role: string; content: string; images?: ImageData[] }[]
  images?: ImageData[]
}

router.post('/generate', async (req: Request<object, object, GenerateBody>, res: Response) => {
  const { prompt, model, currentFiles, history, images } = req.body

  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' })
    return
  }

  const apiKey = getApiKey(req)
  console.log('[generate] API key from frontend:', apiKey ? 'yes' : 'no')

  if (!apiKey) {
    res.status(401).json({ error: 'API key não configurada. Acesse Configurações para adicionar sua chave do Claude.' })
    return
  }

  try {
    const modelId = model || 'claude-haiku-4-5-20251001'
    console.log('[generate] Calling Anthropic SDK | model:', modelId)

    const client = new Anthropic({ apiKey })

    const conversationMessages = buildConversation(history, prompt, currentFiles, images)

    const stream = client.messages.stream({
      model: modelId,
      max_tokens: 16384,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: conversationMessages,
    })

    const response = await stream.finalMessage()

    const rawResponse = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')

    console.log('[generate] Response length:', rawResponse.length)
    console.log('[generate] Stop reason:', response.stop_reason)
    console.log('[generate] Usage:', response.usage)

    res.json({ rawResponse })
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error('[generate] Anthropic API Error:', error.status, error.message)
      res.status(error.status).json({ error: error.message })
    } else {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[generate] Error:', message)
      res.status(500).json({ error: message })
    }
  }
})

/** Rough token estimate: ~4 chars per token */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Builds the full conversation array for the API call.
 *
 * Strategy:
 * - Recent history (last KEEP_RECENT turns) is sent with FULL code blocks
 *   so the AI remembers exactly what it generated.
 * - Older history has code blocks stripped (replaced by file name summaries)
 *   to save tokens while preserving conversational context.
 * - Current project files are always sent in the final user message so the
 *   AI sees the true current state of every file.
 * - Prompt caching is applied to the oldest cached-eligible message to avoid
 *   re-processing the same prefix on every call.
 */
const KEEP_RECENT = 4 // keep last N messages with full code
const CODE_BLOCK_RE = /```[\w]*\s+file="[^"]+"\n[\s\S]*?```/g

function buildConversation(
  history: { role: string; content: string; images?: ImageData[] }[],
  prompt: string,
  currentFiles: Record<string, string>,
  images?: ImageData[],
): Anthropic.MessageParam[] {
  const messages: Anthropic.MessageParam[] = []

  // --- Build history messages ---
  for (let i = 0; i < history.length; i++) {
    const h = history[i]
    const role = (h.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant'
    const isRecent = i >= history.length - KEEP_RECENT

    if (role === 'assistant' && !isRecent) {
      // Compress old assistant messages: strip code, keep file list
      const fileNames = [...h.content.matchAll(/file="([^"]+)"/g)].map((m) => m[1])
      const text = h.content.replace(CODE_BLOCK_RE, '').trim()
      const summary = fileNames.length > 0
        ? `${text}\n[Generated/updated files: ${fileNames.join(', ')}]`
        : text || '[code response]'
      messages.push({ role, content: summary })
    } else if (role === 'user' && h.images && h.images.length > 0) {
      // User messages with images use multimodal content blocks
      const contentBlocks: Anthropic.ContentBlockParam[] = h.images.map((img) => ({
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: img.mediaType, data: img.base64 },
      }))
      contentBlocks.push({ type: 'text' as const, text: h.content })
      messages.push({ role, content: contentBlocks })
    } else {
      messages.push({ role, content: h.content })
    }
  }

  // --- Apply cache_control to the boundary between old and recent history ---
  // This lets the API cache the compressed prefix and only process recent turns
  if (messages.length >= KEEP_RECENT && messages.length > 0) {
    const cacheIdx = Math.max(0, messages.length - KEEP_RECENT)
    const msg = messages[cacheIdx]
    if (typeof msg.content === 'string') {
      messages[cacheIdx] = {
        role: msg.role,
        content: [
          { type: 'text', text: msg.content, cache_control: { type: 'ephemeral' } },
        ],
      }
    }
  }

  // --- Build final user message with current files + new prompt ---
  const entries = Object.entries(currentFiles).filter(([path]) => path !== '/index.html')
  let userContent = ''

  if (entries.length > 0) {
    const fileContext = entries
      .map(([path, code]) => `File: ${path}\n\`\`\`\n${code}\n\`\`\``)
      .join('\n\n')
    userContent += `Current project files (${entries.length} files):\n${fileContext}\n\n`
  }

  userContent += `IMPORTANT: Only return files that NEED TO CHANGE. All other files are preserved automatically.\n\n`
  userContent += `User request: ${prompt}`

  if (images && images.length > 0) {
    const contentBlocks: Anthropic.ContentBlockParam[] = images.map((img) => ({
      type: 'image' as const,
      source: { type: 'base64' as const, media_type: img.mediaType, data: img.base64 },
    }))
    contentBlocks.push({ type: 'text' as const, text: userContent })
    messages.push({ role: 'user', content: contentBlocks })
  } else {
    messages.push({ role: 'user', content: userContent })
  }

  const totalTokens = messages.reduce((sum, m) => {
    const text = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
    return sum + estimateTokens(text)
  }, 0)
  console.log(`[generate] Conversation: ${messages.length} messages, ~${totalTokens} tokens (estimated)`)

  return messages
}

export { router as generateRoute }

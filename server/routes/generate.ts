import { Router, type Request, type Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

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
- Use only React (no external libraries unless explicitly asked)
- If multiple files are needed, return each in its own fenced block
- CRITICAL: Every file that is imported MUST be included in your response. If a file imports '../components/Foo', you MUST include a code block for that file. Never reference a file without providing its complete implementation.
- Always include /App.tsx as the main entry
- ALWAYS use a dark theme with these colors:
  - Backgrounds: bg-[#08080d] (darkest), bg-[#0e0f16] (base), bg-[#151620] (surface), bg-[#1a1b2e] (elevated)
  - Text: text-[#f1f5f9] (headings), text-[#e2e8f0] (body), text-[#94a3b8] (secondary), text-[#64748b] (muted)
  - Accent: text-[#6366f1] / bg-[#6366f1] (primary), hover variants with [#818cf8]
  - Borders: border-[rgba(255,255,255,0.06)] (subtle), border-[rgba(255,255,255,0.1)] (default)
  - Success: text-[#10b981]
  - NEVER use light backgrounds, gradients with purple/blue, or white backgrounds`

interface GenerateBody {
  prompt: string
  model?: string
  currentFiles: Record<string, string>
  history: { role: string; content: string }[]
}

router.post('/generate', async (req: Request<object, object, GenerateBody>, res: Response) => {
  const { prompt, model, currentFiles, history } = req.body

  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  console.log('[generate] Has API key:', !!apiKey)

  if (!apiKey) {
    console.log('[generate] No API key, using placeholder')
    res.json(buildPlaceholderResponse(prompt))
    return
  }

  try {
    const modelId = model || 'claude-haiku-4-5-20251001'
    console.log('[generate] Calling Anthropic SDK | model:', modelId)

    const client = new Anthropic({ apiKey })

    const messages: Anthropic.MessageParam[] = [
      ...history.map((h) => ({
        role: (h.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: h.content,
      })),
      {
        role: 'user',
        content: buildUserPrompt(prompt, currentFiles),
      },
    ]

    const response = await client.messages.create({
      model: modelId,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
    })

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

function buildUserPrompt(prompt: string, currentFiles: Record<string, string>): string {
  const fileContext = Object.entries(currentFiles)
    .map(([path, code]) => `File: ${path}\n\`\`\`\n${code}\n\`\`\``)
    .join('\n\n')

  return fileContext
    ? `Current files:\n${fileContext}\n\nUser request: ${prompt}`
    : prompt
}

function buildPlaceholderResponse(prompt: string) {
  return {
    rawResponse: `Aqui está o código gerado com 2 arquivos:

\`\`\`tsx file="/Header.tsx"
export default function Header() {
  return (
    <header className="px-8 py-4 bg-[#151620] border-b border-white/[0.06] flex items-center justify-between">
      <h1 className="text-xl font-semibold text-[#f1f5f9]">
        Vibe App
      </h1>
      <nav className="flex gap-6">
        <a href="#" className="text-[#94a3b8] text-sm hover:text-[#e2e8f0] transition">Home</a>
        <a href="#" className="text-[#94a3b8] text-sm hover:text-[#e2e8f0] transition">About</a>
        <a href="#" className="text-[#94a3b8] text-sm hover:text-[#e2e8f0] transition">Contact</a>
      </nav>
    </header>
  )
}
\`\`\`

\`\`\`tsx file="/App.tsx"
import Header from './Header'

export default function App() {
  return (
    <div className="min-h-screen bg-[#0e0f16] text-[#e2e8f0] font-sans">
      <Header />
      <main className="flex items-center justify-center px-8 py-16">
        <div className="text-center max-w-xl">
          <h2 className="text-4xl font-semibold text-[#f1f5f9] mb-4">
            Gerado pela IA
          </h2>
          <p className="text-lg text-[#94a3b8] leading-relaxed">
            Prompt: "${prompt}"
          </p>
          <div className="mt-8 px-8 py-4 bg-[#151620] rounded-xl border border-white/[0.06]">
            <p className="text-sm text-[#64748b]">
              Configure ANTHROPIC_API_KEY no .env para IA real.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
\`\`\``,
  }
}

export { router as generateRoute }

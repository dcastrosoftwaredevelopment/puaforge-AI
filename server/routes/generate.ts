import { Router, type Request, type Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()

const SYSTEM_PROMPT = `You are an expert React developer. The user will describe a UI or feature they want.
You must respond with complete file contents using this format:

\`\`\`jsx file="/App.js"
// your code here
\`\`\`

Rules:
- Always return complete files, not partial diffs
- Use inline styles or basic CSS — Tailwind CDN is available
- Use only React (no external libraries unless explicitly asked)
- If multiple files are needed, return each in its own fenced block
- Always include /App.js as the main entry
- ALWAYS use a dark theme with these colors:
  - Backgrounds: #08080d (darkest), #0e0f16 (base), #151620 (surface), #1a1b2e (elevated)
  - Text: #f1f5f9 (headings), #e2e8f0 (body), #94a3b8 (secondary), #64748b (muted)
  - Accent: #6366f1 (primary), #818cf8 (hover)
  - Borders: rgba(255,255,255,0.06) (subtle), rgba(255,255,255,0.1) (default)
  - Success: #10b981
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
    const modelId = model || 'claude-3-haiku-20240307'
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

\`\`\`jsx file="/Header.js"
export default function Header() {
  return (
    <header style={{
      padding: '1rem 2rem',
      background: '#151620',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <h1 style={{ fontSize: '1.25rem', color: '#f1f5f9', fontWeight: 600, margin: 0 }}>
        Vibe App
      </h1>
      <nav style={{ display: 'flex', gap: '1.5rem' }}>
        <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Home</a>
        <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>About</a>
        <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Contact</a>
      </nav>
    </header>
  )
}
\`\`\`

\`\`\`jsx file="/App.js"
import Header from './Header'

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0e0f16',
      color: '#e2e8f0',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Header />
      <main style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '600px' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#f1f5f9', fontWeight: 600 }}>
            Gerado pela IA
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Prompt: "${prompt}"
          </p>
          <div style={{
            marginTop: '2rem',
            padding: '1rem 2rem',
            background: '#151620',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
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

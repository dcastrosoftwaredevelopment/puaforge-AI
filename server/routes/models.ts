import { Router, type Request, type Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { getApiKey } from '../utils/getApiKey.js'

const router = Router()

router.get('/models', async (req: Request, res: Response) => {
  const apiKey = getApiKey(req)
  if (!apiKey) {
    res.json({ models: [] })
    return
  }

  try {
    const client = new Anthropic({ apiKey })
    const page = await client.models.list({ limit: 100 })

    const models = page.data
      .filter((m) => m.id.startsWith('claude-'))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((m) => ({ id: m.id, name: m.display_name }))

    res.json({ models })
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error('[models] Anthropic API Error:', error.status, error.message)
      res.status(error.status).json({ error: error.message })
    } else {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[models] Error:', message)
      res.status(500).json({ error: message })
    }
  }
})

export { router as modelsRoute }

import { Router, type Request, type Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()

// Validate an API key by making a lightweight call
router.post('/settings/validate-key', async (req: Request, res: Response) => {
  const { apiKey } = req.body

  if (!apiKey) {
    res.status(400).json({ valid: false, error: 'API key é obrigatória' })
    return
  }

  try {
    const client = new Anthropic({ apiKey })
    await client.models.list({ limit: 1 })
    res.json({ valid: true })
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      res.json({ valid: false, error: `Chave inválida: ${error.message}` })
    } else {
      res.json({ valid: false, error: 'Erro ao validar chave' })
    }
  }
})

export { router as settingsRoute }

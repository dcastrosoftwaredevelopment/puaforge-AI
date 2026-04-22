import { type Request, type Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

export async function validateApiKey(req: Request, res: Response) {
  const { apiKey } = req.body;

  if (!apiKey) {
    res.status(400).json({ code: 'MISSING_API_KEY', valid: false, error: 'API key is required' });
    return;
  }

  try {
    const client = new Anthropic({ apiKey });
    await client.models.list({ limit: 1 });
    res.json({ valid: true });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      res.json({ code: 'INVALID_API_KEY', valid: false, error: `Invalid key: ${error.message}` });
    } else {
      res.json({ code: 'VALIDATION_ERROR', valid: false, error: 'Failed to validate key' });
    }
  }
}

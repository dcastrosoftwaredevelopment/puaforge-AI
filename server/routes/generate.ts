import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generate } from '../handlers/generateHandlers.js';

const router = Router();

router.post('/generate', requireAuth, generate);

export { router as generateRoute };

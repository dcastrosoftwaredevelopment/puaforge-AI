import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { publish } from '../handlers/publishHandlers.js';

const router = Router();

router.post('/publish', requireAuth, publish);

export { router as publishRoute };

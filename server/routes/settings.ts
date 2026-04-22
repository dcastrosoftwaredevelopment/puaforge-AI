import { Router } from 'express';
import { validateApiKey } from '../handlers/settingsHandlers.js';

const router = Router();

router.post('/settings/validate-key', validateApiKey);

export { router as settingsRoute };

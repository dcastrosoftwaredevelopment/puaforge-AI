import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { importSite } from '../handlers/importSiteHandlers.js';

const router = Router();

router.post('/import-site', requireAuth, importSite);

export { router as importSiteRoute };

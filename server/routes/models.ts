import { Router } from 'express';
import { listModels } from '../handlers/modelsHandlers.js';

const router = Router();

router.get('/models', listModels);

export { router as modelsRoute };

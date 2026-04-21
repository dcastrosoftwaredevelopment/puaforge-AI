import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getUserUsage, getCheckpointUsage, getPlans } from '../handlers/usageHandlers.js'

const router = Router()

router.get('/user/usage', requireAuth, getUserUsage)
router.get('/projects/:id/checkpoints/usage', requireAuth, getCheckpointUsage)
router.get('/plans', getPlans)

export { router as usageRoute }

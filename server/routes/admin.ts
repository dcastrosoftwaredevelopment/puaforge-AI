import { Router } from 'express';
import { requireSuperUser } from '../middleware/auth.js';
import { listUsers, updateUserStatus } from '../handlers/adminHandlers.js';

const router = Router();

router.get('/users', requireSuperUser, listUsers);
router.patch('/users/:id/status', requireSuperUser, updateUserStatus);

export default router;

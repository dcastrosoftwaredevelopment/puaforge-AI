import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listTeams, createTeam, deleteTeam, listMembers, addMember, removeMember } from '../handlers/teamHandlers.js';

const router = Router();

router.get('/', requireAuth, listTeams);
router.post('/', requireAuth, createTeam);
router.delete('/:id', requireAuth, deleteTeam);
router.get('/:id/members', requireAuth, listMembers);
router.post('/:id/members', requireAuth, addMember);
router.delete('/:id/members/:memberId', requireAuth, removeMember);

export default router;

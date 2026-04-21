import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { updateProfile } from '../handlers/profileHandlers.js';

export const profileRoute = Router();

profileRoute.patch('/profile', requireAuth, updateProfile);

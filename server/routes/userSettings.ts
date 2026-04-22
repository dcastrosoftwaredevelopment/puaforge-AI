import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getUserSettings, updateUserSettings } from '../handlers/userSettingsHandlers.js';

export const userSettingsRoute = Router();

userSettingsRoute.get('/user/settings', requireAuth, getUserSettings);
userSettingsRoute.post('/user/settings', requireAuth, updateUserSettings);

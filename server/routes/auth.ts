import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { register, login, googleAuth, verifyEmail, resendVerification, getMe } from '../handlers/authHandlers.js';

export const authRoute = Router();

authRoute.post('/auth/register', register);
authRoute.post('/auth/login', login);
authRoute.post('/auth/google', googleAuth);
authRoute.get('/auth/verify-email', verifyEmail);
authRoute.post('/auth/resend-verification', resendVerification);
authRoute.get('/auth/me', requireAuth, getMe);

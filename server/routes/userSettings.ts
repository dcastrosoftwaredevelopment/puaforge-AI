import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db.js';
import { userSettings } from '../schema.js';
import { requireAuth } from '../middleware/auth.js';

export const userSettingsRoute = Router();

userSettingsRoute.get('/user/settings', requireAuth, async (req, res) => {
  const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, req.user!.userId));

  res.json({
    apiKey: settings?.apiKey ?? null,
    apiKeyEnabled: settings?.apiKeyEnabled ?? true,
  });
});

userSettingsRoute.post('/user/settings', requireAuth, async (req, res) => {
  const { apiKey, apiKeyEnabled } = req.body as { apiKey?: string; apiKeyEnabled?: boolean };

  await db
    .insert(userSettings)
    .values({
      userId: req.user!.userId,
      ...(apiKey !== undefined && { apiKey }),
      ...(apiKeyEnabled !== undefined && { apiKeyEnabled }),
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        ...(apiKey !== undefined && { apiKey }),
        ...(apiKeyEnabled !== undefined && { apiKeyEnabled }),
        updatedAt: new Date(),
      },
    });

  res.json({ ok: true });
});

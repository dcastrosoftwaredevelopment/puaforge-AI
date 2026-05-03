import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { eq, or } from 'drizzle-orm';
import { db } from '../db.js';
import { users, userSettings } from '../schema.js';
import { signToken } from '../middleware/auth.js';
import { enqueueVerificationEmail } from '../services/emailQueue.js';

const RESEND_BLOCK_MS = 5 * 60 * 1000;

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function buildUserResponse(user: { id: string; email: string; name: string | null; emailVerified: boolean; role: string; status: string }) {
  return { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified, role: user.role, status: user.status };
}

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body as { email: string; password: string; name: string };

  if (!email || !password || !name) {
    res.status(400).json({ code: 'ERROR_MISSING_FIELDS' });
    return;
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));

  if (existing) {
    // Pre-registered by superuser script (no password yet) — allow completing registration
    if (!existing.passwordHash) {
      const passwordHash = await bcrypt.hash(password, 10);
      const verificationToken = randomUUID();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const now = new Date();
      await db
        .update(users)
        .set({ name, passwordHash, emailVerified: false, emailVerificationToken: verificationToken, emailVerificationExpiry: verificationExpiry, lastVerificationEmailSentAt: now })
        .where(eq(users.id, existing.id));
      await enqueueVerificationEmail(email, verificationToken);
      res.status(202).json({ status: 'needs_verification' });
    } else {
      res.status(409).json({ code: 'ERROR_EMAIL_ALREADY_USED' });
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = randomUUID();
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const now = new Date();
  await db.insert(users).values({
    email,
    name,
    passwordHash,
    emailVerified: false,
    emailVerificationToken: verificationToken,
    emailVerificationExpiry: verificationExpiry,
    lastVerificationEmailSentAt: now,
    role: 'user',
    status: 'pending',
  });

  await enqueueVerificationEmail(email, verificationToken);
  res.status(202).json({ status: 'needs_verification' });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ code: 'ERROR_MISSING_FIELDS' });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user?.passwordHash) {
    res.status(401).json({ code: 'ERROR_INVALID_CREDENTIALS' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ code: 'ERROR_INVALID_CREDENTIALS' });
    return;
  }

  if (!user.emailVerified) {
    const verificationToken = randomUUID();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const enqueued = await enqueueVerificationEmail(email, verificationToken);
    if (enqueued) {
      await db
        .update(users)
        .set({ emailVerificationToken: verificationToken, emailVerificationExpiry: verificationExpiry, lastVerificationEmailSentAt: new Date() })
        .where(eq(users.id, user.id));
    }
    res.status(403).json({ code: 'ERROR_EMAIL_NOT_VERIFIED' });
    return;
  }

  if (user.status === 'pending') {
    res.status(403).json({ code: 'ERROR_ACCOUNT_PENDING_APPROVAL' });
    return;
  }

  if (user.status === 'blocked') {
    res.status(403).json({ code: 'ERROR_ACCOUNT_BLOCKED' });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json({ token, user: buildUserResponse(user) });
}

export async function googleAuth(req: Request, res: Response) {
  const { credential } = req.body as { credential: string };

  if (!credential) {
    res.status(400).json({ code: 'ERROR_MISSING_FIELDS' });
    return;
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    res.status(401).json({ code: 'ERROR_INVALID_GOOGLE_TOKEN' });
    return;
  }

  const { sub: googleId, email, name } = payload;

  let [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.googleId, googleId), eq(users.email, email!)));

  if (!user) {
    [user] = await db
      .insert(users)
      .values({ email: email!, name, googleId, emailVerified: true, role: 'user', status: 'pending' })
      .returning();
  } else {
    [user] = await db
      .update(users)
      .set({ googleId, emailVerified: true })
      .where(eq(users.email, email!))
      .returning();
  }

  if (user.status === 'pending') {
    res.status(403).json({ code: 'ERROR_ACCOUNT_PENDING_APPROVAL' });
    return;
  }

  if (user.status === 'blocked') {
    res.status(403).json({ code: 'ERROR_ACCOUNT_BLOCKED' });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json({ token, user: buildUserResponse(user) });
}

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.query as { token: string };

  if (!token) {
    res.status(400).json({ code: 'ERROR_MISSING_TOKEN' });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));

  if (!user) {
    res.status(400).json({ code: 'ERROR_INVALID_TOKEN' });
    return;
  }

  if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
    res.status(400).json({ code: 'ERROR_TOKEN_EXPIRED' });
    return;
  }

  await db
    .update(users)
    .set({ emailVerified: true, emailVerificationToken: null, emailVerificationExpiry: null })
    .where(eq(users.id, user.id));

  // After verification the account is still pending — they'll see the approval message on next login
  const jwtToken = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json({ token: jwtToken, user: buildUserResponse({ ...user, emailVerified: true }) });
}

export async function resendVerification(req: Request, res: Response) {
  const { email } = req.body as { email: string };

  if (!email) {
    res.status(400).json({ code: 'ERROR_MISSING_FIELDS' });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    res.json({ status: 'sent' });
    return;
  }

  if (user.emailVerified) {
    res.status(400).json({ code: 'ERROR_ALREADY_VERIFIED' });
    return;
  }

  if (user.lastVerificationEmailSentAt && Date.now() - user.lastVerificationEmailSentAt.getTime() < RESEND_BLOCK_MS) {
    res.status(429).json({ code: 'ERROR_EMAIL_RECENTLY_SENT' });
    return;
  }

  const verificationToken = randomUUID();
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const enqueued = await enqueueVerificationEmail(email, verificationToken);
  if (!enqueued) {
    res.status(429).json({ code: 'ERROR_EMAIL_RECENTLY_SENT' });
    return;
  }

  await db
    .update(users)
    .set({ emailVerificationToken: verificationToken, emailVerificationExpiry: verificationExpiry, lastVerificationEmailSentAt: new Date() })
    .where(eq(users.id, user.id));

  res.json({ status: 'sent' });
}

export async function getMe(req: Request, res: Response) {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      emailVerified: users.emailVerified,
      role: users.role,
      status: users.status,
      apiKey: userSettings.apiKey,
      apiKeyEnabled: userSettings.apiKeyEnabled,
    })
    .from(users)
    .leftJoin(userSettings, eq(users.id, userSettings.userId))
    .where(eq(users.id, req.user!.userId));

  if (!row) {
    res.status(404).json({ code: 'ERROR_USER_NOT_FOUND' });
    return;
  }

  res.json({
    id: row.id,
    email: row.email,
    name: row.name,
    emailVerified: row.emailVerified,
    role: row.role,
    status: row.status,
    apiKey: row.apiKey ?? null,
    apiKeyEnabled: row.apiKeyEnabled ?? true,
  });
}

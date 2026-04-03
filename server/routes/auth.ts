import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import { eq, or } from 'drizzle-orm'
import { db } from '../db.js'
import { users, userSettings } from '../schema.js'
import { signToken, requireAuth } from '../middleware/auth.js'
import { sendVerificationEmail } from '../services/email.js'

export const authRoute = Router()

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// Register
authRoute.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body as { email: string; password: string; name: string }

  if (!email || !password || !name) {
    res.status(400).json({ code: 'ERROR_MISSING_FIELDS' })
    return
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existing.length > 0) {
    res.status(409).json({ code: 'ERROR_EMAIL_ALREADY_USED' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const verificationToken = randomUUID()
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await db.insert(users).values({
    email,
    name,
    passwordHash,
    emailVerified: false,
    emailVerificationToken: verificationToken,
    emailVerificationExpiry: verificationExpiry,
  })

  await sendVerificationEmail(email, verificationToken)

  res.status(202).json({ status: 'needs_verification' })
})

// Login
authRoute.post('/auth/login', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string }

  if (!email || !password) {
    res.status(400).json({ code: 'ERROR_MISSING_FIELDS' })
    return
  }

  const [user] = await db.select().from(users).where(eq(users.email, email))

  if (!user?.passwordHash) {
    res.status(401).json({ code: 'ERROR_INVALID_CREDENTIALS' })
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ code: 'ERROR_INVALID_CREDENTIALS' })
    return
  }

  if (!user.emailVerified) {
    // Regenerate token so they can request a fresh one
    const verificationToken = randomUUID()
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await db.update(users).set({ emailVerificationToken: verificationToken, emailVerificationExpiry: verificationExpiry }).where(eq(users.id, user.id))
    await sendVerificationEmail(email, verificationToken)
    res.status(403).json({ code: 'ERROR_EMAIL_NOT_VERIFIED' })
    return
  }

  const token = signToken({ userId: user.id, email: user.email })
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified } })
})

// Google OAuth
authRoute.post('/auth/google', async (req, res) => {
  const { credential } = req.body as { credential: string }

  if (!credential) {
    res.status(400).json({ code: 'ERROR_MISSING_FIELDS' })
    return
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()
  if (!payload?.email) {
    res.status(401).json({ code: 'ERROR_INVALID_GOOGLE_TOKEN' })
    return
  }

  const { sub: googleId, email, name } = payload

  let [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.googleId, googleId), eq(users.email, email!)))

  if (!user) {
    ;[user] = await db
      .insert(users)
      .values({ email: email!, name, googleId, emailVerified: true })
      .returning()
  } else {
    await db.update(users).set({ googleId, emailVerified: true }).where(eq(users.email, email!))
    user = { ...user, googleId, emailVerified: true }
  }

  const token = signToken({ userId: user.id, email: user.email })
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified } })
})

// Verify email via token link
authRoute.get('/auth/verify-email', async (req, res) => {
  const { token } = req.query as { token: string }

  if (!token) {
    res.status(400).json({ code: 'ERROR_MISSING_TOKEN' })
    return
  }

  const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token))

  if (!user) {
    res.status(400).json({ code: 'ERROR_INVALID_TOKEN' })
    return
  }

  if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
    res.status(400).json({ code: 'ERROR_TOKEN_EXPIRED' })
    return
  }

  await db.update(users)
    .set({ emailVerified: true, emailVerificationToken: null, emailVerificationExpiry: null })
    .where(eq(users.id, user.id))

  const jwtToken = signToken({ userId: user.id, email: user.email })
  res.json({ token: jwtToken, user: { id: user.id, email: user.email, name: user.name, emailVerified: true } })
})

// Resend verification email
authRoute.post('/auth/resend-verification', async (req, res) => {
  const { email } = req.body as { email: string }

  if (!email) {
    res.status(400).json({ code: 'ERROR_MISSING_FIELDS' })
    return
  }

  const [user] = await db.select().from(users).where(eq(users.email, email))

  if (!user) {
    // Don't reveal whether the email exists
    res.json({ status: 'sent' })
    return
  }

  if (user.emailVerified) {
    res.status(400).json({ code: 'ERROR_ALREADY_VERIFIED' })
    return
  }

  const verificationToken = randomUUID()
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await db.update(users)
    .set({ emailVerificationToken: verificationToken, emailVerificationExpiry: verificationExpiry })
    .where(eq(users.id, user.id))

  await sendVerificationEmail(email, verificationToken)
  res.json({ status: 'sent' })
})

// Me
authRoute.get('/auth/me', requireAuth, async (req, res) => {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      emailVerified: users.emailVerified,
      apiKey: userSettings.apiKey,
      apiKeyEnabled: userSettings.apiKeyEnabled,
    })
    .from(users)
    .leftJoin(userSettings, eq(users.id, userSettings.userId))
    .where(eq(users.id, req.user!.userId))

  if (!row) {
    res.status(404).json({ code: 'ERROR_USER_NOT_FOUND' })
    return
  }

  res.json({
    id: row.id,
    email: row.email,
    name: row.name,
    emailVerified: row.emailVerified,
    apiKey: row.apiKey ?? null,
    apiKeyEnabled: row.apiKeyEnabled ?? true,
  })
})

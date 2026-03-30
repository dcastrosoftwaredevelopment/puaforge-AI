import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'
import { eq, or } from 'drizzle-orm'
import { db } from '../db.js'
import { users, userSettings } from '../schema.js'
import { signToken, requireAuth } from '../middleware/auth.js'

export const authRoute = Router()

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// Register
authRoute.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body as { email: string; password: string; name: string }

  if (!email || !password || !name) {
    res.status(400).json({ error: 'Email, nome e senha são obrigatórios' })
    return
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existing.length > 0) {
    res.status(409).json({ error: 'Email já cadastrado' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash })
    .returning({ id: users.id, email: users.email, name: users.name })

  const token = signToken({ userId: user.id, email: user.email })
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
})

// Login
authRoute.post('/auth/login', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string }

  if (!email || !password) {
    res.status(400).json({ error: 'Email e senha são obrigatórios' })
    return
  }

  const [user] = await db.select().from(users).where(eq(users.email, email))

  if (!user?.passwordHash) {
    res.status(401).json({ error: 'Email ou senha inválidos' })
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Email ou senha inválidos' })
    return
  }

  const token = signToken({ userId: user.id, email: user.email })
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
})

// Google OAuth
authRoute.post('/auth/google', async (req, res) => {
  const { credential } = req.body as { credential: string }

  if (!credential) {
    res.status(400).json({ error: 'Credential do Google obrigatória' })
    return
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()
  if (!payload?.email) {
    res.status(401).json({ error: 'Token do Google inválido' })
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
      .values({ email: email!, name, googleId })
      .returning()
  } else {
    await db.update(users).set({ googleId }).where(eq(users.email, email!))
  }

  const token = signToken({ userId: user.id, email: user.email })
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
})

// Me
authRoute.get('/auth/me', requireAuth, async (req, res) => {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      apiKey: userSettings.apiKey,
      apiKeyEnabled: userSettings.apiKeyEnabled,
    })
    .from(users)
    .leftJoin(userSettings, eq(users.id, userSettings.userId))
    .where(eq(users.id, req.user!.userId))

  if (!row) {
    res.status(404).json({ error: 'Usuário não encontrado' })
    return
  }

  res.json({
    id: row.id,
    email: row.email,
    name: row.name,
    apiKey: row.apiKey ?? null,
    apiKeyEnabled: row.apiKeyEnabled ?? true,
  })
})

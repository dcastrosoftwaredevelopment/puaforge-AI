import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'
import { pool } from '../db.js'
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

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows.length > 0) {
    res.status(409).json({ error: 'Email já cadastrado' })
    return
  }

  const password_hash = await bcrypt.hash(password, 10)
  const result = await pool.query(
    'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name',
    [email, name, password_hash],
  )

  const user = result.rows[0] as { id: string; email: string; name: string }
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

  const result = await pool.query(
    'SELECT id, email, name, password_hash FROM users WHERE email = $1',
    [email],
  )

  const user = result.rows[0] as
    | { id: string; email: string; name: string; password_hash: string }
    | undefined

  if (!user || !user.password_hash) {
    res.status(401).json({ error: 'Email ou senha inválidos' })
    return
  }

  const valid = await bcrypt.compare(password, user.password_hash)
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

  let result = await pool.query(
    'SELECT id, email, name FROM users WHERE google_id = $1 OR email = $2',
    [googleId, email],
  )

  if (result.rows.length === 0) {
    result = await pool.query(
      'INSERT INTO users (email, name, google_id) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, name, googleId],
    )
  } else {
    await pool.query('UPDATE users SET google_id = $1 WHERE email = $2', [googleId, email])
  }

  const user = result.rows[0] as { id: string; email: string; name: string }
  const token = signToken({ userId: user.id, email: user.email })
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
})

// Me
authRoute.get('/auth/me', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT id, email, name, api_key FROM users WHERE id = $1', [
    req.user!.userId,
  ])
  const user = result.rows[0] as
    | { id: string; email: string; name: string; api_key: string | null }
    | undefined

  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' })
    return
  }

  res.json({ id: user.id, email: user.email, name: user.name, apiKey: user.api_key })
})

// Save API key
authRoute.post('/auth/api-key', requireAuth, async (req, res) => {
  const { apiKey } = req.body as { apiKey: string }
  await pool.query('UPDATE users SET api_key = $1 WHERE id = $2', [apiKey, req.user!.userId])
  res.json({ ok: true })
})

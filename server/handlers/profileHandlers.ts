import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '../db.js'
import { users } from '../schema.js'

export async function updateProfile(req: Request, res: Response) {
  const { name, currentPassword, newPassword } = req.body as {
    name?: string
    currentPassword?: string
    newPassword?: string
  }

  const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId))

  if (!user) {
    res.status(404).json({ code: 'ERROR_USER_NOT_FOUND' })
    return
  }

  if (newPassword) {
    if (!currentPassword) {
      res.status(400).json({ code: 'ERROR_MISSING_CURRENT_PASSWORD' })
      return
    }
    if (!user.passwordHash) {
      res.status(400).json({ code: 'ERROR_NO_PASSWORD_SET' })
      return
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      res.status(401).json({ code: 'ERROR_INVALID_CURRENT_PASSWORD' })
      return
    }
  }

  await db
    .update(users)
    .set({
      ...(name && { name }),
      ...(newPassword && { passwordHash: await bcrypt.hash(newPassword, 10) }),
    })
    .where(eq(users.id, req.user!.userId))

  res.json({ ok: true })
}

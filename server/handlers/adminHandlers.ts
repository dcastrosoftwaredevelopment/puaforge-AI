import type { Request, Response } from 'express';
import { eq, desc, count, and } from 'drizzle-orm';
import { db } from '../db.js';
import { users } from '../schema.js';

export async function listUsers(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const statusFilter = req.query.status as string | undefined;
  const offset = (page - 1) * limit;

  const where =
    statusFilter && ['pending', 'active', 'blocked'].includes(statusFilter)
      ? eq(users.status, statusFilter)
      : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(users)
    .where(where);

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    users: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function updateUserStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body as { status: string };

  if (!['active', 'blocked'].includes(status)) {
    res.status(400).json({ code: 'ERROR_INVALID_STATUS' });
    return;
  }

  if (id === req.user!.userId) {
    res.status(400).json({ code: 'ERROR_CANNOT_MODIFY_SELF' });
    return;
  }

  const [target] = await db.select({ role: users.role }).from(users).where(eq(users.id, id));
  if (!target) {
    res.status(404).json({ code: 'ERROR_USER_NOT_FOUND' });
    return;
  }

  if (target.role === 'superuser' && status === 'blocked') {
    res.status(400).json({ code: 'ERROR_CANNOT_BLOCK_SUPERUSER' });
    return;
  }

  await db.update(users).set({ status }).where(eq(users.id, id));
  res.json({ success: true });
}

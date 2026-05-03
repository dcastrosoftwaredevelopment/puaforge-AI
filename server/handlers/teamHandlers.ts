import type { Request, Response } from 'express';
import { eq, or, and } from 'drizzle-orm';
import { db } from '../db.js';
import { teams, teamMembers, users } from '../schema.js';
import { checkTeamLimit, PlanLimitError } from '../services/plans.js';

export async function listTeams(req: Request, res: Response) {
  const userId = req.user!.userId;

  // Teams owned by user
  const owned = await db
    .select({ id: teams.id, name: teams.name, ownerId: teams.ownerId, createdAt: teams.createdAt })
    .from(teams)
    .where(eq(teams.ownerId, userId));

  // Teams the user is a member of (but not owner)
  const memberOf = await db
    .select({ id: teams.id, name: teams.name, ownerId: teams.ownerId, createdAt: teams.createdAt })
    .from(teams)
    .innerJoin(teamMembers, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId));

  const all = [...owned, ...memberOf];
  const unique = Array.from(new Map(all.map((t) => [t.id, t])).values());

  res.json(unique);
}

export async function createTeam(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { name } = req.body as { name: string };

  if (!name?.trim()) {
    res.status(400).json({ code: 'ERROR_MISSING_FIELDS' });
    return;
  }

  try {
    await checkTeamLimit(userId);
  } catch (err) {
    if (err instanceof PlanLimitError) {
      res.status(403).json({ code: 'ERROR_TEAM_LIMIT_REACHED', limitType: err.limitType, requiredPlan: err.requiredPlan });
      return;
    }
    throw err;
  }

  const [team] = await db.insert(teams).values({ ownerId: userId, name: name.trim() }).returning();
  res.status(201).json(team);
}

export async function deleteTeam(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;

  const [team] = await db.select().from(teams).where(and(eq(teams.id, id), eq(teams.ownerId, userId)));
  if (!team) {
    res.status(404).json({ code: 'ERROR_TEAM_NOT_FOUND' });
    return;
  }

  await db.delete(teams).where(eq(teams.id, id));
  res.json({ success: true });
}

export async function listMembers(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;

  const team = await assertTeamAccess(id, userId, res);
  if (!team) return;

  const members = await db
    .select({ id: users.id, name: users.name, email: users.email, joinedAt: teamMembers.joinedAt })
    .from(teamMembers)
    .innerJoin(users, eq(users.id, teamMembers.userId))
    .where(eq(teamMembers.teamId, id));

  res.json(members);
}

export async function addMember(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { email } = req.body as { email: string };

  if (!email?.trim()) {
    res.status(400).json({ code: 'ERROR_MISSING_FIELDS' });
    return;
  }

  const [team] = await db.select().from(teams).where(and(eq(teams.id, id), eq(teams.ownerId, userId)));
  if (!team) {
    res.status(404).json({ code: 'ERROR_TEAM_NOT_FOUND' });
    return;
  }

  const [member] = await db.select({ id: users.id, status: users.status }).from(users).where(eq(users.email, email.trim().toLowerCase()));
  if (!member) {
    res.status(404).json({ code: 'ERROR_USER_NOT_FOUND' });
    return;
  }

  if (member.status !== 'active') {
    res.status(400).json({ code: 'ERROR_USER_NOT_ACTIVE' });
    return;
  }

  if (member.id === userId) {
    res.status(400).json({ code: 'ERROR_CANNOT_ADD_SELF' });
    return;
  }

  await db.insert(teamMembers).values({ teamId: id, userId: member.id }).onConflictDoNothing();
  res.status(201).json({ success: true });
}

export async function removeMember(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { id, memberId } = req.params;

  const [team] = await db.select().from(teams).where(eq(teams.id, id));
  if (!team) {
    res.status(404).json({ code: 'ERROR_TEAM_NOT_FOUND' });
    return;
  }

  // Owner can remove anyone; members can only remove themselves
  if (team.ownerId !== userId && memberId !== userId) {
    res.status(403).json({ code: 'ERROR_FORBIDDEN' });
    return;
  }

  await db.delete(teamMembers).where(and(eq(teamMembers.teamId, id), eq(teamMembers.userId, memberId)));
  res.json({ success: true });
}

async function assertTeamAccess(teamId: string, userId: string, res: Response) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) {
    res.status(404).json({ code: 'ERROR_TEAM_NOT_FOUND' });
    return null;
  }

  if (team.ownerId === userId) return team;

  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));

  if (!membership) {
    res.status(403).json({ code: 'ERROR_FORBIDDEN' });
    return null;
  }

  return team;
}

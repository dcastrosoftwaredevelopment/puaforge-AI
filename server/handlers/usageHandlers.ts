import type { Request, Response } from 'express';
import { eq, count, sql, and, isNotNull } from 'drizzle-orm';
import { db } from '../db.js';
import { projects, projectImages, checkpoints, publishedSites } from '../schema.js';
import { getOrCreateSubscription, getUserPlan, PLAN_LIMITS } from '../services/plans.js';

function serializeLimit(n: number) {
  return n === Infinity ? -1 : n;
}

export async function getUserUsage(req: Request, res: Response) {
  const userId = req.user!.userId;

  const [, plan] = await Promise.all([
    getOrCreateSubscription(userId),
    getUserPlan(userId),
  ]);

  const limits = PLAN_LIMITS[plan];

  const [{ projectCount }] = await db
    .select({ projectCount: count() })
    .from(projects)
    .where(eq(projects.userId, userId));

  const [{ domainCount }] = await db
    .select({ domainCount: count() })
    .from(projects)
    .where(and(eq(projects.userId, userId), isNotNull(projects.customDomain)));

  const [{ subdomainCount }] = await db
    .select({ subdomainCount: count() })
    .from(publishedSites)
    .innerJoin(projects, eq(publishedSites.projectId, projects.id))
    .where(and(eq(projects.userId, userId), isNotNull(publishedSites.subdomain)));

  const [{ storageBytes }] = await db
    .select({ storageBytes: sql<number>`coalesce(sum(${projectImages.size}), 0)` })
    .from(projectImages)
    .innerJoin(projects, eq(projectImages.projectId, projects.id))
    .where(eq(projects.userId, userId));

  res.json({
    plan,
    usage: {
      projects: { used: projectCount, limit: serializeLimit(limits.maxProjects) },
      customDomains: { used: domainCount, limit: serializeLimit(limits.maxCustomDomains) },
      storageBytes: { used: Number(storageBytes), limit: serializeLimit(limits.maxStorageBytes) },
      publishedSites: { used: subdomainCount, limit: serializeLimit(limits.maxPublishedSites) },
    },
  });
}

export async function getCheckpointUsage(req: Request, res: Response) {
  const projectId = req.params.id as string;
  const userId = req.user!.userId;
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  const [{ value }] = await db
    .select({ value: count() })
    .from(checkpoints)
    .where(eq(checkpoints.projectId, projectId));

  res.json({ used: value, limit: limits.maxCheckpointsPerProject });
}

export function getPlans(_req: Request, res: Response) {
  const plans = Object.fromEntries(
    Object.entries(PLAN_LIMITS).map(([plan, limits]) => [
      plan,
      {
        maxProjects: serializeLimit(limits.maxProjects),
        maxCustomDomains: serializeLimit(limits.maxCustomDomains),
        maxStorageBytes: serializeLimit(limits.maxStorageBytes),
        maxCheckpointsPerProject: serializeLimit(limits.maxCheckpointsPerProject),
        maxPublishedSites: serializeLimit(limits.maxPublishedSites),
      },
    ]),
  );

  res.json(plans);
}

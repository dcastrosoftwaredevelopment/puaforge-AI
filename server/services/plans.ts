import { eq, and, count, isNotNull } from 'drizzle-orm'
import { db } from '../db.js'
import { subscriptions, projects, projectImages, checkpoints, users, publishedSites } from '../schema.js'

export type Plan = 'free' | 'indie' | 'pro'

export const PLAN_LIMITS = {
  free: {
    maxProjects: 1,
    maxCustomDomains: 0,
    maxStorageBytes: 5 * 1024 * 1024, // 5MB
    maxCheckpointsPerProject: 0,
    maxPublishedSites: 1,
  },
  indie: {
    maxProjects: 3,
    maxCustomDomains: 1,
    maxStorageBytes: 100 * 1024 * 1024, // 100MB
    maxCheckpointsPerProject: 10,
    maxPublishedSites: 1,
  },
  pro: {
    maxProjects: Infinity,
    maxCustomDomains: 5,
    maxStorageBytes: 1024 * 1024 * 1024, // 1GB
    maxCheckpointsPerProject: Infinity,
    maxPublishedSites: 5,
  },
} as const satisfies Record<Plan, {
  maxProjects: number
  maxCustomDomains: number
  maxStorageBytes: number
  maxCheckpointsPerProject: number
  maxPublishedSites: number
}>

function getSuperUserEmails(): string[] {
  return (process.env.SUPERUSER_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export async function isSuperUser(userId: string): Promise<boolean> {
  const emails = getSuperUserEmails()
  if (emails.length === 0) return false
  const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1)
  return !!user && emails.includes(user.email.toLowerCase())
}

export class PlanLimitError extends Error {
  constructor(
    message: string,
    public readonly requiredPlan: 'indie' | 'pro',
    public readonly limitType: string,
  ) {
    super(message)
    this.name = 'PlanLimitError'
  }
}

/** Gets or creates a subscription row for the user (defaults to free). */
export async function getOrCreateSubscription(userId: string) {
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)

  if (existing) return existing

  const [created] = await db
    .insert(subscriptions)
    .values({ userId, plan: 'free', status: 'active' })
    .onConflictDoNothing()
    .returning()

  if (created) return created

  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)

  return row
}

export async function getUserPlan(userId: string): Promise<Plan> {
  if (await isSuperUser(userId)) return 'pro'
  const sub = await getOrCreateSubscription(userId)
  if (sub.status !== 'active') return 'free'
  return sub.plan as Plan
}

export async function checkProjectLimit(userId: string): Promise<void> {
  if (await isSuperUser(userId)) return
  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan]
  if (limits.maxProjects === Infinity) return

  const [{ value }] = await db
    .select({ value: count() })
    .from(projects)
    .where(eq(projects.userId, userId))

  if (value >= limits.maxProjects) {
    throw new PlanLimitError(
      `Project limit of ${limits.maxProjects} reached for the ${planLabel(plan)} plan.`,
      plan === 'free' ? 'indie' : 'pro',
      'projects',
    )
  }
}

export async function checkPublishAccess(userId: string): Promise<void> {
  if (await isSuperUser(userId)) return
  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan]
  if (limits.maxPublishedSites === Infinity) return

  const [{ value }] = await db
    .select({ value: count() })
    .from(publishedSites)
    .innerJoin(projects, eq(projects.id, publishedSites.projectId))
    .where(and(eq(projects.userId, userId), isNotNull(publishedSites.subdomain)))

  if (value >= limits.maxPublishedSites) {
    throw new PlanLimitError(
      `Published site limit of ${limits.maxPublishedSites} reached for the ${planLabel(plan)} plan.`,
      plan === 'free' ? 'indie' : 'pro',
      'publish',
    )
  }
}

export async function checkDomainLimit(userId: string): Promise<void> {
  if (await isSuperUser(userId)) return
  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan]
  if (limits.maxCustomDomains === 0) {
    throw new PlanLimitError(
      'Custom domains are not available on the Free plan.',
      'indie',
      'customDomain',
    )
  }
  if (limits.maxCustomDomains === Infinity) return

  const [{ value }] = await db
    .select({ value: count() })
    .from(projects)
    .where(and(
      eq(projects.userId, userId),
      isNotNull(projects.customDomain),
    ))

  if (value >= limits.maxCustomDomains) {
    throw new PlanLimitError(
      `Custom domain limit of ${limits.maxCustomDomains} reached for the ${planLabel(plan)} plan.`,
      'pro',
      'customDomain',
    )
  }
}

export async function checkStorageLimit(userId: string, newFileBytes: number): Promise<void> {
  if (await isSuperUser(userId)) return
  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan]
  if (limits.maxStorageBytes === 0) {
    throw new PlanLimitError(
      'Image upload is not available on the Free plan.',
      'indie',
      'storage',
    )
  }
  if (limits.maxStorageBytes === Infinity) return

  // Sum storage across all projects of the user
  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${projectImages.size}), 0)` })
    .from(projectImages)
    .innerJoin(projects, eq(projectImages.projectId, projects.id))
    .where(eq(projects.userId, userId))

  if (total + newFileBytes > limits.maxStorageBytes) {
    const limitMb = Math.round(limits.maxStorageBytes / 1024 / 1024)
    throw new PlanLimitError(
      `Storage limit of ${limitMb}MB reached for the ${planLabel(plan)} plan.`,
      'pro',
      'storage',
    )
  }
}

export async function checkCheckpointLimit(userId: string, projectId: string): Promise<void> {
  if (await isSuperUser(userId)) return
  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan]
  if (limits.maxCheckpointsPerProject === 0) {
    throw new PlanLimitError(
      'Checkpoints are not available on the Free plan.',
      'indie',
      'checkpoints',
    )
  }
  if (limits.maxCheckpointsPerProject === Infinity) return

  const [{ value }] = await db
    .select({ value: count() })
    .from(checkpoints)
    .where(eq(checkpoints.projectId, projectId))

  if (value >= limits.maxCheckpointsPerProject) {
    throw new PlanLimitError(
      `Checkpoint limit of ${limits.maxCheckpointsPerProject} per project reached for the ${planLabel(plan)} plan.`,
      'pro',
      'checkpoints',
    )
  }
}

function planLabel(plan: Plan): string {
  return plan === 'free' ? 'Free' : plan === 'indie' ? 'Indie' : 'Pro'
}

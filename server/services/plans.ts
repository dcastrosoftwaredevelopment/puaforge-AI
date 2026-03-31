import { eq, and, count, sql } from 'drizzle-orm'
import { db } from '../db.js'
import { subscriptions, projects, projectImages, checkpoints } from '../schema.js'

export type Plan = 'free' | 'indie' | 'pro'

export const PLAN_LIMITS = {
  free: {
    maxProjects: 1,
    maxCustomDomains: 0,
    maxImportsPerMonth: 0,
    maxStorageBytes: 0,
    maxCheckpointsPerProject: 0,
    canPublish: false,
  },
  indie: {
    maxProjects: 3,
    maxCustomDomains: 1,
    maxImportsPerMonth: 3,
    maxStorageBytes: 100 * 1024 * 1024, // 100MB
    maxCheckpointsPerProject: 10,
    canPublish: true,
  },
  pro: {
    maxProjects: Infinity,
    maxCustomDomains: 5,
    maxImportsPerMonth: Infinity,
    maxStorageBytes: 1024 * 1024 * 1024, // 1GB
    maxCheckpointsPerProject: Infinity,
    canPublish: true,
  },
} as const satisfies Record<Plan, {
  maxProjects: number
  maxCustomDomains: number
  maxImportsPerMonth: number
  maxStorageBytes: number
  maxCheckpointsPerProject: number
  canPublish: boolean
}>

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
    .returning()

  return created
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const sub = await getOrCreateSubscription(userId)
  if (sub.status !== 'active') return 'free'
  return sub.plan as Plan
}

export async function checkProjectLimit(userId: string): Promise<void> {
  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan]
  if (limits.maxProjects === Infinity) return

  const [{ value }] = await db
    .select({ value: count() })
    .from(projects)
    .where(eq(projects.userId, userId))

  if (value >= limits.maxProjects) {
    throw new PlanLimitError(
      `Limite de ${limits.maxProjects} projeto(s) atingido para o plano ${planLabel(plan)}.`,
      plan === 'free' ? 'indie' : 'pro',
      'projects',
    )
  }
}

export async function checkPublishAccess(userId: string): Promise<void> {
  const plan = await getUserPlan(userId)
  if (!PLAN_LIMITS[plan].canPublish) {
    throw new PlanLimitError(
      'Publicação de sites não está disponível no plano Gratuito.',
      'indie',
      'publish',
    )
  }
}

export async function checkDomainLimit(userId: string): Promise<void> {
  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan]
  if (limits.maxCustomDomains === 0) {
    throw new PlanLimitError(
      'Domínios customizados não estão disponíveis no plano Gratuito.',
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
      sql`${projects.customDomain} IS NOT NULL`,
    ))

  if (value >= limits.maxCustomDomains) {
    throw new PlanLimitError(
      `Limite de ${limits.maxCustomDomains} domínio(s) customizado(s) atingido para o plano ${planLabel(plan)}.`,
      plan === 'indie' ? 'pro' : 'pro',
      'customDomain',
    )
  }
}

export async function checkImportLimit(userId: string): Promise<void> {
  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan]

  if (limits.maxImportsPerMonth === 0) {
    throw new PlanLimitError(
      'Importação de sites não está disponível no plano Gratuito.',
      'indie',
      'imports',
    )
  }
  if (limits.maxImportsPerMonth === Infinity) return

  const sub = await getOrCreateSubscription(userId)

  // Reset counter if we're in a new calendar month
  const now = new Date()
  const resetAt = new Date(sub.importsResetAt)
  const isNewMonth = now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()

  if (isNewMonth) {
    await db
      .update(subscriptions)
      .set({ importsThisMonth: 0, importsResetAt: now, updatedAt: now })
      .where(eq(subscriptions.userId, userId))
    return // counter was reset, allow this import
  }

  if (sub.importsThisMonth >= limits.maxImportsPerMonth) {
    throw new PlanLimitError(
      `Limite de ${limits.maxImportsPerMonth} import(s) por mês atingido para o plano ${planLabel(plan)}.`,
      plan === 'indie' ? 'pro' : 'pro',
      'imports',
    )
  }
}

/** Call after a successful import to increment the counter. */
export async function incrementImportCount(userId: string): Promise<void> {
  await db
    .update(subscriptions)
    .set({
      importsThisMonth: sql`${subscriptions.importsThisMonth} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId))
}

export async function checkStorageLimit(userId: string, newFileBytes: number): Promise<void> {
  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan]
  if (limits.maxStorageBytes === 0) {
    throw new PlanLimitError(
      'Upload de imagens não está disponível no plano Gratuito.',
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
      `Limite de armazenamento de ${limitMb}MB atingido para o plano ${planLabel(plan)}.`,
      plan === 'indie' ? 'pro' : 'pro',
      'storage',
    )
  }
}

export async function checkCheckpointLimit(userId: string, projectId: string): Promise<void> {
  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan]
  if (limits.maxCheckpointsPerProject === 0) {
    throw new PlanLimitError(
      'Checkpoints não estão disponíveis no plano Gratuito.',
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
      `Limite de ${limits.maxCheckpointsPerProject} checkpoint(s) por projeto atingido para o plano ${planLabel(plan)}.`,
      plan === 'indie' ? 'pro' : 'pro',
      'checkpoints',
    )
  }
}

function planLabel(plan: Plan): string {
  return plan === 'free' ? 'Gratuito' : plan === 'indie' ? 'Indie' : 'Pro'
}

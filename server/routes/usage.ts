import { Router } from 'express'
import { eq, count, sql, and, isNotNull } from 'drizzle-orm'
import { db } from '../db.js'
import { projects, projectImages, checkpoints } from '../schema.js'
import { requireAuth } from '../middleware/auth.js'
import { getOrCreateSubscription, getUserPlan, PLAN_LIMITS } from '../services/plans.js'

const router = Router()

router.get('/user/usage', requireAuth, async (req, res) => {
  const userId = req.user!.userId

  const [sub, plan] = await Promise.all([
    getOrCreateSubscription(userId),
    getUserPlan(userId),
  ])

  const limits = PLAN_LIMITS[plan]

  // Project count
  const [{ projectCount }] = await db
    .select({ projectCount: count() })
    .from(projects)
    .where(eq(projects.userId, userId))

  // Custom domain count
  const [{ domainCount }] = await db
    .select({ domainCount: count() })
    .from(projects)
    .where(and(eq(projects.userId, userId), isNotNull(projects.customDomain)))

  // Total storage
  const [{ storageBytes }] = await db
    .select({ storageBytes: sql<number>`coalesce(sum(${projectImages.size}), 0)` })
    .from(projectImages)
    .innerJoin(projects, eq(projectImages.projectId, projects.id))
    .where(eq(projects.userId, userId))

  // Reset import counter if new month
  const now = new Date()
  const resetAt = new Date(sub.importsResetAt)
  const isNewMonth = now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()
  const importsThisMonth = isNewMonth ? 0 : sub.importsThisMonth

  // Infinity cannot be serialized to JSON — use -1 as sentinel for "unlimited"
  function serializeLimit(n: number) { return n === Infinity ? -1 : n }

  res.json({
    plan,
    usage: {
      projects: { used: projectCount, limit: serializeLimit(limits.maxProjects) },
      customDomains: { used: domainCount, limit: serializeLimit(limits.maxCustomDomains) },
      importsThisMonth: { used: importsThisMonth, limit: serializeLimit(limits.maxImportsPerMonth) },
      storageBytes: { used: Number(storageBytes), limit: serializeLimit(limits.maxStorageBytes) },
    },
  })
})

// Returns checkpoint count for a specific project (used by checkpoint UI)
router.get('/projects/:id/checkpoints/usage', requireAuth, async (req, res) => {
  const projectId = req.params.id as string
  const userId = req.user!.userId
  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan]

  const [{ value }] = await db
    .select({ value: count() })
    .from(checkpoints)
    .where(eq(checkpoints.projectId, projectId))

  res.json({ used: value, limit: limits.maxCheckpointsPerProject })
})

// Public endpoint — no auth required, just returns the plan limits config
router.get('/plans', (_req, res) => {
  function serializeLimit(n: number) { return n === Infinity ? -1 : n }

  const plans = Object.fromEntries(
    Object.entries(PLAN_LIMITS).map(([plan, limits]) => [
      plan,
      {
        maxProjects: serializeLimit(limits.maxProjects),
        maxCustomDomains: serializeLimit(limits.maxCustomDomains),
        maxImportsPerMonth: serializeLimit(limits.maxImportsPerMonth),
        maxStorageBytes: serializeLimit(limits.maxStorageBytes),
        maxCheckpointsPerProject: serializeLimit(limits.maxCheckpointsPerProject),
        maxPublishedSites: serializeLimit(limits.maxPublishedSites),
      },
    ]),
  )

  res.json(plans)
})

export { router as usageRoute }

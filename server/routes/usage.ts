import { Router } from 'express'
import { eq, count, sql } from 'drizzle-orm'
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
    .where(sql`${projects.userId} = ${userId} AND ${projects.customDomain} IS NOT NULL`)

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

  res.json({
    plan,
    usage: {
      projects: { used: projectCount, limit: limits.maxProjects },
      customDomains: { used: domainCount, limit: limits.maxCustomDomains },
      importsThisMonth: { used: importsThisMonth, limit: limits.maxImportsPerMonth },
      storageBytes: { used: Number(storageBytes), limit: limits.maxStorageBytes },
    },
    // Per-project checkpoint counts are fetched separately since they vary per project
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

export { router as usageRoute }

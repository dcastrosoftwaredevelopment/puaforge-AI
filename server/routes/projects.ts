import { Router, type Request, type Response } from 'express'
import { eq, and, asc, ne } from 'drizzle-orm'
import multer from 'multer'
import { db } from '../db.js'
import { projects, messages, projectFiles, projectImages, checkpoints, publishedSites } from '../schema.js'
import { requireAuth } from '../middleware/auth.js'
import { uploadFileToPocketBase, deleteFileFromPocketBase, savePublishedSite, fetchPublishedSite } from '../services/pocketbase.js'
import { invalidateSiteCache, invalidateSubdomainCache } from '../middleware/siteServing.js'
import { checkProjectLimit, checkDomainLimit, checkStorageLimit, checkCheckpointLimit, checkPublishAccess, PlanLimitError } from '../services/plans.js'

function handlePlanLimit(err: unknown, res: Response): boolean {
  if (err instanceof PlanLimitError) {
    res.status(403).json({ error: err.message, upgradeRequired: true, requiredPlan: err.requiredPlan, limitType: err.limitType })
    return true
  }
  return false
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

const router = Router()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toMs(date: Date | null | undefined): number {
  return date ? date.getTime() : 0
}

/** Express 5 types req.params as string | string[] — this extracts the string value */
function p(req: Request, name: string): string {
  return req.params[name] as string
}

async function assertOwnership(projectId: string, userId: string, res: Response): Promise<boolean> {
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)

  if (!project) {
    res.status(404).json({ code: 'PROJECT_NOT_FOUND', error: 'Project not found' })
    return false
  }
  return true
}

// ─── Projects ─────────────────────────────────────────────────────────────────

router.get('/projects', requireAuth, async (req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, req.user!.userId))
    .orderBy(asc(projects.updatedAt))

  res.json(rows.map((p) => ({ ...p, createdAt: toMs(p.createdAt), updatedAt: toMs(p.updatedAt) })))
})

router.post('/projects', requireAuth, async (req: Request, res: Response) => {
  try { await checkProjectLimit(req.user!.userId) } catch (err) { if (handlePlanLimit(err, res)) return; throw err }

  const { id, name, createdAt, updatedAt } = req.body as {
    id: string; name: string; createdAt: number; updatedAt: number
  }

  const [project] = await db
    .insert(projects)
    .values({
      id,
      userId: req.user!.userId,
      name,
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
    })
    .returning()

  res.json({ ...project, createdAt: toMs(project.createdAt), updatedAt: toMs(project.updatedAt) })
})

router.patch('/projects/:id', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return
  const { name } = req.body as { name: string }

  await db
    .update(projects)
    .set({ name, updatedAt: new Date() })
    .where(eq(projects.id, p(req, 'id')))

  res.json({ ok: true })
})

router.delete('/projects/:id', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  await db.delete(projects).where(eq(projects.id, p(req, 'id')))
  res.json({ ok: true })
})

// ─── Domain ───────────────────────────────────────────────────────────────────

router.get('/projects/:id/domain', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  const [row] = await db
    .select({ customDomain: projects.customDomain })
    .from(projects)
    .where(eq(projects.id, p(req, 'id')))
    .limit(1)

  res.json({ customDomain: row?.customDomain ?? null })
})

router.put('/projects/:id/domain', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  const { customDomain, force } = req.body as { customDomain: string | null; force?: boolean }

  // Only enforce the domain limit when ADDING a new domain to a project that doesn't have one yet.
  // Updating or clearing an existing domain is always allowed (grandfather existing domains).
  if (customDomain) {
    const [current] = await db
      .select({ customDomain: projects.customDomain })
      .from(projects)
      .where(eq(projects.id, p(req, 'id')))
      .limit(1)
    const isNewDomain = !current?.customDomain
    if (isNewDomain) {
      try { await checkDomainLimit(req.user!.userId) } catch (err) { if (handlePlanLimit(err, res)) return; throw err }
    }
  }

  if (customDomain) {
    const [existing] = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.customDomain, customDomain))
      .limit(1)

    if (existing && existing.id !== p(req, 'id')) {
      // Check if the conflicting project belongs to the current user
      const [ownedByUser] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, existing.id), eq(projects.userId, req.user!.userId)))
        .limit(1)

      if (!ownedByUser) {
        // Domain belongs to another user — always block
        res.status(409).json({ code: 'DOMAIN_TAKEN', error: 'Domain is already in use' })
        return
      }

      // Domain belongs to one of the user's own projects
      if (!force) {
        res.status(409).json({
          code: 'DOMAIN_OWN_PROJECT',
          error: `Este domínio está em uso no projeto "${existing.name}"`,
          conflictingProjectName: existing.name,
        })
        return
      }

      // force=true: remove domain from the conflicting project and invalidate cache
      await db.update(projects).set({ customDomain: null }).where(eq(projects.id, existing.id))
      invalidateSiteCache(customDomain)
    }
  }

  await db
    .update(projects)
    .set({ customDomain: customDomain ?? null })
    .where(eq(projects.id, p(req, 'id')))

  res.json({ ok: true })
})

// ─── Palette ──────────────────────────────────────────────────────────────────

router.get('/projects/:id/palette', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  const [row] = await db
    .select({ palette: projects.palette })
    .from(projects)
    .where(eq(projects.id, p(req, 'id')))
    .limit(1)

  res.json(row?.palette ?? null)
})

router.put('/projects/:id/palette', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  const { palette } = req.body as { palette: { id: string; name: string; value: string; locked?: boolean }[] }
  if (!Array.isArray(palette)) {
    res.status(400).json({ code: 'INVALID_PALETTE', error: 'palette must be an array' })
    return
  }

  await db.update(projects).set({ palette }).where(eq(projects.id, p(req, 'id')))
  res.json({ ok: true })
})

// ─── Messages ─────────────────────────────────────────────────────────────────

router.get('/projects/:id/messages', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.projectId, p(req, 'id')))
    .orderBy(asc(messages.createdAt))

  res.json(rows.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: toMs(m.createdAt),
    images: m.images ?? undefined,
  })))
})

router.put('/projects/:id/messages', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  const { msgs } = req.body as {
    msgs: Array<{ id: string; role: string; content: string; timestamp: number; images?: unknown }>
  }

  await db.transaction(async (tx) => {
    await tx.delete(messages).where(eq(messages.projectId, p(req, 'id')))
    if (msgs.length > 0) {
      await tx.insert(messages).values(
        msgs.map((m) => ({
          id: m.id,
          projectId: p(req, 'id'),
          role: m.role,
          content: m.content,
          images: m.images ?? null,
          createdAt: new Date(m.timestamp),
        })),
      )
    }
  })

  res.json({ ok: true })
})

// ─── Files ─────────────────────────────────────────────────────────────────────

router.get('/projects/:id/files', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  const rows = await db
    .select()
    .from(projectFiles)
    .where(eq(projectFiles.projectId, p(req, 'id')))

  const fileMap: Record<string, string> = {}
  for (const f of rows) fileMap[f.path] = f.code
  res.json(fileMap)
})

router.put('/projects/:id/files', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  const files = req.body as Record<string, string>

  await db.transaction(async (tx) => {
    await tx.delete(projectFiles).where(eq(projectFiles.projectId, p(req, 'id')))
    const entries = Object.entries(files)
    if (entries.length > 0) {
      await tx.insert(projectFiles).values(
        entries.map(([path, code]) => ({
          projectId: p(req, 'id'),
          path,
          code,
          updatedAt: new Date(),
        })),
      )
    }
  })

  await db
    .update(projects)
    .set({ updatedAt: new Date() })
    .where(eq(projects.id, p(req, 'id')))

  res.json({ ok: true })
})

// ─── Images ─────────────────────────────────────────────────────────────────────

router.get('/projects/:id/images', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  const rows = await db
    .select()
    .from(projectImages)
    .where(eq(projectImages.projectId, p(req, 'id')))

  res.json(rows.map((img) => ({
    id: img.id,
    name: img.name,
    mediaType: img.mediaType,
    size: img.size,
    url: img.url,
  })))
})

router.post('/projects/:id/images', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  if (!req.file) {
    res.status(400).json({ code: 'NO_FILE', error: 'No file provided' })
    return
  }

  try { await checkStorageLimit(req.user!.userId, req.file.size) } catch (err) { if (handlePlanLimit(err, res)) return; throw err }

  const url = await uploadFileToPocketBase(req.file.buffer, req.file.originalname, req.file.mimetype, p(req, 'id'))
  const id = crypto.randomUUID()

  await db.insert(projectImages).values({
    id,
    projectId: p(req, 'id'),
    name: req.file.originalname,
    url,
    mediaType: req.file.mimetype,
    size: req.file.size,
  })

  res.json({ id, name: req.file.originalname, url, mediaType: req.file.mimetype, size: req.file.size })
})

router.patch('/projects/:id/images/:imageId', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  const { name } = req.body as { name: string }
  await db
    .update(projectImages)
    .set({ name })
    .where(and(eq(projectImages.id, p(req, 'imageId')), eq(projectImages.projectId, p(req, 'id'))))

  res.json({ ok: true })
})

router.delete('/projects/:id/images/:imageId', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  const [image] = await db
    .select({ url: projectImages.url })
    .from(projectImages)
    .where(and(eq(projectImages.id, p(req, 'imageId')), eq(projectImages.projectId, p(req, 'id'))))
    .limit(1)

  if (image) await deleteFileFromPocketBase(image.url)

  await db
    .delete(projectImages)
    .where(and(eq(projectImages.id, p(req, 'imageId')), eq(projectImages.projectId, p(req, 'id'))))

  res.json({ ok: true })
})

// ─── Checkpoints ──────────────────────────────────────────────────────────────

router.get('/projects/:id/checkpoints', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  const rows = await db
    .select()
    .from(checkpoints)
    .where(eq(checkpoints.projectId, p(req, 'id')))
    .orderBy(asc(checkpoints.createdAt))

  res.json(rows.map((c) => ({
    id: c.id,
    name: c.name,
    files: c.files,
    createdAt: toMs(c.createdAt),
  })))
})

router.post('/projects/:id/checkpoints', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  try { await checkCheckpointLimit(req.user!.userId, p(req, 'id')) } catch (err) { if (handlePlanLimit(err, res)) return; throw err }

  const { id, name, files, createdAt } = req.body as {
    id: string; name: string; files: Record<string, string>; createdAt: number
  }

  await db.insert(checkpoints).values({
    id,
    projectId: p(req, 'id'),
    name,
    files,
    createdAt: new Date(createdAt),
  })

  res.json({ ok: true })
})

router.patch('/projects/:id/checkpoints/:checkpointId', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  const { name } = req.body as { name: string }
  await db
    .update(checkpoints)
    .set({ name })
    .where(and(eq(checkpoints.id, p(req, 'checkpointId')), eq(checkpoints.projectId, p(req, 'id'))))

  res.json({ ok: true })
})

router.delete('/projects/:id/checkpoints/:checkpointId', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  await db
    .delete(checkpoints)
    .where(and(eq(checkpoints.id, p(req, 'checkpointId')), eq(checkpoints.projectId, p(req, 'id'))))

  res.json({ ok: true })
})

// ─── Published site ────────────────────────────────────────────────────────────

router.get('/projects/:id/published', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  const [site] = await db
    .select()
    .from(publishedSites)
    .where(eq(publishedSites.projectId, p(req, 'id')))
    .limit(1)

  if (!site) {
    res.status(404).json({ code: 'NOT_PUBLISHED', error: 'Site not published' })
    return
  }

  const html = await fetchPublishedSite(site.pbRecordId)
  if (!html) {
    res.status(404).json({ code: 'HTML_NOT_FOUND', error: 'HTML file not found in storage' })
    return
  }

  res.json({ html, publishedAt: toMs(site.publishedAt), subdomain: site.subdomain ?? null })
})

router.put('/projects/:id/published', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return

  const { html, publishedAt } = req.body as { html: string; publishedAt: number }

  let pbRecordId: string
  try {
    pbRecordId = await savePublishedSite(p(req, 'id'), html)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao salvar no PocketBase'
    console.error('[published] PocketBase save failed:', message)
    res.status(500).json({ code: 'POCKETBASE_ERROR', error: message })
    return
  }

  // Preserve existing subdomain (never overwrite once set)
  const [existing] = await db
    .select({ subdomain: publishedSites.subdomain })
    .from(publishedSites)
    .where(eq(publishedSites.projectId, p(req, 'id')))
    .limit(1)

  const subdomain = existing?.subdomain ?? null

  await db
    .insert(publishedSites)
    .values({ projectId: p(req, 'id'), pbRecordId, subdomain, publishedAt: new Date(publishedAt) })
    .onConflictDoUpdate({
      target: publishedSites.projectId,
      set: { pbRecordId, publishedAt: new Date(publishedAt) },
    })

  if (subdomain) invalidateSubdomainCache(subdomain)

  res.json({ ok: true, subdomain })
})

// ─── Subdomain ────────────────────────────────────────────────────────────────

const SUBDOMAIN_REGEX = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/
const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'app', 'mail', 'ftp', 'admin', 'static', 'cdn', 'status', 'blog', 'docs'])

function isValidSubdomain(slug: string): boolean {
  return SUBDOMAIN_REGEX.test(slug) && !slug.includes('--') && !RESERVED_SUBDOMAINS.has(slug)
}

/** Check if a subdomain slug is available (public — no auth required) */
router.get('/subdomains/check', async (req: Request, res: Response) => {
  const slug = (req.query.slug as string ?? '').toLowerCase().trim()

  if (!slug) {
    res.status(400).json({ code: 'MISSING_SLUG', error: 'slug is required' })
    return
  }

  if (!isValidSubdomain(slug)) {
    res.json({ available: false, reason: 'invalid' })
    return
  }

  const [existing] = await db
    .select({ projectId: publishedSites.projectId })
    .from(publishedSites)
    .where(eq(publishedSites.subdomain, slug))
    .limit(1)

  res.json({ available: !existing })
})

/** Set or update the subdomain for a project */
router.put('/projects/:id/subdomain', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(p(req, 'id'), req.user!.userId, res)) return
  try { await checkPublishAccess(req.user!.userId) } catch (err) { if (handlePlanLimit(err, res)) return; throw err }

  const slug = (req.body.subdomain as string ?? '').toLowerCase().trim()

  if (!slug) {
    res.status(400).json({ code: 'MISSING_SUBDOMAIN', error: 'subdomain is required' })
    return
  }

  if (!isValidSubdomain(slug)) {
    res.status(400).json({ code: 'INVALID_SUBDOMAIN', error: 'Invalid subdomain' })
    return
  }

  // Fetch current subdomain to invalidate cache on change
  const [existing] = await db
    .select({ subdomain: publishedSites.subdomain })
    .from(publishedSites)
    .where(eq(publishedSites.projectId, p(req, 'id')))
    .limit(1)

  // Check uniqueness — exclude this project's own row
  const [conflict] = await db
    .select({ projectId: publishedSites.projectId })
    .from(publishedSites)
    .where(and(eq(publishedSites.subdomain, slug), ne(publishedSites.projectId, p(req, 'id'))))
    .limit(1)

  if (conflict) {
    res.status(409).json({ code: 'SUBDOMAIN_TAKEN', error: 'Subdomain is already taken' })
    return
  }

  // Invalidate old subdomain cache if changing
  if (existing?.subdomain && existing.subdomain !== slug) {
    invalidateSubdomainCache(existing.subdomain)
  }

  // Save — upsert so it works whether the site has been published or not yet
  await db
    .insert(publishedSites)
    .values({ projectId: p(req, 'id'), pbRecordId: '', subdomain: slug, publishedAt: new Date(0) })
    .onConflictDoUpdate({
      target: publishedSites.projectId,
      set: { subdomain: slug },
    })

  res.json({ ok: true, subdomain: slug })
})

export { router as projectsRoute }

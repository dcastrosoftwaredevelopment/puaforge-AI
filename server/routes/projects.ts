import { Router, type Request, type Response } from 'express'
import { eq, and, asc } from 'drizzle-orm'
import { db } from '../db.js'
import { projects, messages, projectFiles, projectImages, checkpoints, publishedSites } from '../schema.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toMs(date: Date | null | undefined): number {
  return date ? date.getTime() : 0
}

async function assertOwnership(projectId: string, userId: string, res: Response): Promise<boolean> {
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)

  if (!project) {
    res.status(404).json({ error: 'Projeto não encontrado' })
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
  if (!await assertOwnership(req.params.id, req.user!.userId, res)) return
  const { name } = req.body as { name: string }

  await db
    .update(projects)
    .set({ name, updatedAt: new Date() })
    .where(eq(projects.id, req.params.id))

  res.json({ ok: true })
})

router.delete('/projects/:id', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(req.params.id, req.user!.userId, res)) return

  await db.delete(projects).where(eq(projects.id, req.params.id))
  res.json({ ok: true })
})

// ─── Messages ─────────────────────────────────────────────────────────────────

router.get('/projects/:id/messages', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(req.params.id, req.user!.userId, res)) return

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.projectId, req.params.id))
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
  if (!await assertOwnership(req.params.id, req.user!.userId, res)) return

  const { msgs } = req.body as {
    msgs: Array<{ id: string; role: string; content: string; timestamp: number; images?: unknown }>
  }

  await db.transaction(async (tx) => {
    await tx.delete(messages).where(eq(messages.projectId, req.params.id))
    if (msgs.length > 0) {
      await tx.insert(messages).values(
        msgs.map((m) => ({
          id: m.id,
          projectId: req.params.id,
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
  if (!await assertOwnership(req.params.id, req.user!.userId, res)) return

  const rows = await db
    .select()
    .from(projectFiles)
    .where(eq(projectFiles.projectId, req.params.id))

  const fileMap: Record<string, string> = {}
  for (const f of rows) fileMap[f.path] = f.code
  res.json(fileMap)
})

router.put('/projects/:id/files', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(req.params.id, req.user!.userId, res)) return

  const files = req.body as Record<string, string>

  await db.transaction(async (tx) => {
    await tx.delete(projectFiles).where(eq(projectFiles.projectId, req.params.id))
    const entries = Object.entries(files)
    if (entries.length > 0) {
      await tx.insert(projectFiles).values(
        entries.map(([path, code]) => ({
          projectId: req.params.id,
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
    .where(eq(projects.id, req.params.id))

  res.json({ ok: true })
})

// ─── Images ─────────────────────────────────────────────────────────────────────

router.get('/projects/:id/images', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(req.params.id, req.user!.userId, res)) return

  const rows = await db
    .select()
    .from(projectImages)
    .where(eq(projectImages.projectId, req.params.id))

  res.json(rows.map((img) => ({
    id: img.id,
    name: img.name,
    mediaType: img.mediaType,
    size: img.size,
    // Reconstruct data URL from bytea buffer
    dataUrl: `data:${img.mediaType};base64,${(img.data as Buffer).toString('base64')}`,
  })))
})

router.post('/projects/:id/images', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(req.params.id, req.user!.userId, res)) return

  const { id, name, mediaType, size, data } = req.body as {
    id: string; name: string; mediaType: string; size: number; data: string
  }

  await db.insert(projectImages).values({
    id,
    projectId: req.params.id,
    name,
    data: Buffer.from(data, 'base64'),
    mediaType,
    size,
  })

  res.json({ ok: true })
})

router.patch('/projects/:id/images/:imageId', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(req.params.id, req.user!.userId, res)) return

  const { name } = req.body as { name: string }
  await db
    .update(projectImages)
    .set({ name })
    .where(and(eq(projectImages.id, req.params.imageId), eq(projectImages.projectId, req.params.id)))

  res.json({ ok: true })
})

router.delete('/projects/:id/images/:imageId', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(req.params.id, req.user!.userId, res)) return

  await db
    .delete(projectImages)
    .where(and(eq(projectImages.id, req.params.imageId), eq(projectImages.projectId, req.params.id)))

  res.json({ ok: true })
})

// ─── Checkpoints ──────────────────────────────────────────────────────────────

router.get('/projects/:id/checkpoints', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(req.params.id, req.user!.userId, res)) return

  const rows = await db
    .select()
    .from(checkpoints)
    .where(eq(checkpoints.projectId, req.params.id))
    .orderBy(asc(checkpoints.createdAt))

  res.json(rows.map((c) => ({
    id: c.id,
    name: c.name,
    files: c.files,
    createdAt: toMs(c.createdAt),
  })))
})

router.post('/projects/:id/checkpoints', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(req.params.id, req.user!.userId, res)) return

  const { id, name, files, createdAt } = req.body as {
    id: string; name: string; files: Record<string, string>; createdAt: number
  }

  await db.insert(checkpoints).values({
    id,
    projectId: req.params.id,
    name,
    files,
    createdAt: new Date(createdAt),
  })

  res.json({ ok: true })
})

router.patch('/projects/:id/checkpoints/:checkpointId', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(req.params.id, req.user!.userId, res)) return

  const { name } = req.body as { name: string }
  await db
    .update(checkpoints)
    .set({ name })
    .where(and(eq(checkpoints.id, req.params.checkpointId), eq(checkpoints.projectId, req.params.id)))

  res.json({ ok: true })
})

router.delete('/projects/:id/checkpoints/:checkpointId', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(req.params.id, req.user!.userId, res)) return

  await db
    .delete(checkpoints)
    .where(and(eq(checkpoints.id, req.params.checkpointId), eq(checkpoints.projectId, req.params.id)))

  res.json({ ok: true })
})

// ─── Published site ────────────────────────────────────────────────────────────

router.get('/projects/:id/published', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(req.params.id, req.user!.userId, res)) return

  const [site] = await db
    .select()
    .from(publishedSites)
    .where(eq(publishedSites.projectId, req.params.id))
    .limit(1)

  if (!site) {
    res.status(404).json({ error: 'Não publicado' })
    return
  }

  res.json({ html: site.html, publishedAt: toMs(site.publishedAt) })
})

router.put('/projects/:id/published', requireAuth, async (req: Request, res: Response) => {
  if (!await assertOwnership(req.params.id, req.user!.userId, res)) return

  const { html, publishedAt } = req.body as { html: string; publishedAt: number }

  await db
    .insert(publishedSites)
    .values({ projectId: req.params.id, html, publishedAt: new Date(publishedAt) })
    .onConflictDoUpdate({
      target: publishedSites.projectId,
      set: { html, publishedAt: new Date(publishedAt) },
    })

  res.json({ ok: true })
})

export { router as projectsRoute }

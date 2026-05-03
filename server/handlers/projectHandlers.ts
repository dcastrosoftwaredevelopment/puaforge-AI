import type { Request, Response } from 'express';
import { eq, and, asc, ne, inArray } from 'drizzle-orm';
import multer from 'multer';
import { db } from '../db.js';
import { projects, messages, projectFiles, projectImages, checkpoints, publishedSites, teams, teamMembers, projectTeams, users } from '../schema.js';
import {
  uploadFileToPocketBase,
  deleteFileFromPocketBase,
  savePublishedSite,
  fetchPublishedSite,
} from '../services/pocketbase.js';
import { invalidateSiteCache, invalidateSubdomainCache } from '../middleware/siteServing.js';
import {
  checkProjectLimit,
  checkDomainLimit,
  checkStorageLimit,
  checkCheckpointLimit,
  checkPublishAccess,
  PlanLimitError,
} from '../services/plans.js';

// ─── Shared middleware ────────────────────────────────────────────────────────

export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Internal helpers ─────────────────────────────────────────────────────────

function handlePlanLimit(err: unknown, res: Response): boolean {
  if (err instanceof PlanLimitError) {
    res
      .status(403)
      .json({ error: err.message, upgradeRequired: true, requiredPlan: err.requiredPlan, limitType: err.limitType });
    return true;
  }
  return false;
}

function toMs(date: Date | null | undefined): number {
  return date ? date.getTime() : 0;
}

function p(req: Request, name: string): string {
  return req.params[name] as string;
}

async function assertOwnership(projectId: string, userId: string, res: Response): Promise<boolean> {
  // Direct owner check
  const [owned] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (owned) return true;

  // Team-shared access: project must be shared with a team the user is a member of
  const [shared] = await db
    .select({ id: projects.id })
    .from(projects)
    .innerJoin(projectTeams, eq(projectTeams.projectId, projects.id))
    .innerJoin(teamMembers, eq(teamMembers.teamId, projectTeams.teamId))
    .where(and(eq(projects.id, projectId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (!shared) {
    res.status(404).json({ code: 'PROJECT_NOT_FOUND', error: 'Project not found' });
    return false;
  }
  return true;
}

const SUBDOMAIN_REGEX = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'app',
  'mail',
  'ftp',
  'admin',
  'static',
  'cdn',
  'status',
  'blog',
  'docs',
]);

function isValidSubdomain(slug: string): boolean {
  return SUBDOMAIN_REGEX.test(slug) && !slug.includes('--') && !RESERVED_SUBDOMAINS.has(slug);
}

// ─── Projects CRUD ────────────────────────────────────────────────────────────

export async function listProjects(req: Request, res: Response) {
  const userId = req.user!.userId;

  // Own projects
  const ownRows = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(asc(projects.updatedAt));

  // Projects shared with teams the user is a member of (not own projects)
  const sharedRows = await db
    .select({
      id: projects.id,
      userId: projects.userId,
      name: projects.name,
      palette: projects.palette,
      customDomain: projects.customDomain,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(projects)
    .innerJoin(projectTeams, eq(projectTeams.projectId, projects.id))
    .innerJoin(teamMembers, eq(teamMembers.teamId, projectTeams.teamId))
    .innerJoin(users, eq(users.id, projects.userId))
    .where(and(eq(teamMembers.userId, userId), ne(projects.userId, userId)))
    .orderBy(asc(projects.updatedAt));

  const own = ownRows.map((r) => ({ ...r, createdAt: toMs(r.createdAt), updatedAt: toMs(r.updatedAt), sharedBy: null }));
  const shared = sharedRows.map((r) => ({
    id: r.id,
    userId: r.userId,
    name: r.name,
    palette: r.palette,
    customDomain: r.customDomain,
    createdAt: toMs(r.createdAt),
    updatedAt: toMs(r.updatedAt),
    sharedBy: { name: r.ownerName, email: r.ownerEmail },
  }));

  // Deduplicate (a project may be shared via multiple teams)
  const seen = new Set(own.map((p) => p.id));
  const uniqueShared = shared.filter((p) => !seen.has(p.id));

  res.json([...own, ...uniqueShared]);
}

export async function createProject(req: Request, res: Response) {
  try {
    await checkProjectLimit(req.user!.userId);
  } catch (err) {
    if (handlePlanLimit(err, res)) return;
    throw err;
  }

  const { id, name, createdAt, updatedAt } = req.body as {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
  };

  const [project] = await db
    .insert(projects)
    .values({ id, userId: req.user!.userId, name, createdAt: new Date(createdAt), updatedAt: new Date(updatedAt) })
    .returning();

  res.json({ ...project, createdAt: toMs(project.createdAt), updatedAt: toMs(project.updatedAt) });
}

export async function updateProject(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;
  const { name } = req.body as { name: string };
  await db
    .update(projects)
    .set({ name, updatedAt: new Date() })
    .where(eq(projects.id, p(req, 'id')));
  res.json({ ok: true });
}

export async function deleteProject(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;
  await db.delete(projects).where(eq(projects.id, p(req, 'id')));
  res.json({ ok: true });
}

// ─── Domain ───────────────────────────────────────────────────────────────────

export async function getDomain(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const [row] = await db
    .select({ customDomain: projects.customDomain })
    .from(projects)
    .where(eq(projects.id, p(req, 'id')))
    .limit(1);

  res.json({ customDomain: row?.customDomain ?? null });
}

export async function saveDomain(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const { customDomain, force } = req.body as { customDomain: string | null; force?: boolean };

  if (customDomain) {
    const [current] = await db
      .select({ customDomain: projects.customDomain })
      .from(projects)
      .where(eq(projects.id, p(req, 'id')))
      .limit(1);

    if (!current?.customDomain) {
      try {
        await checkDomainLimit(req.user!.userId);
      } catch (err) {
        if (handlePlanLimit(err, res)) return;
        throw err;
      }
    }

    const [existing] = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.customDomain, customDomain))
      .limit(1);

    if (existing && existing.id !== p(req, 'id')) {
      const [ownedByUser] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, existing.id), eq(projects.userId, req.user!.userId)))
        .limit(1);

      if (!ownedByUser) {
        res.status(409).json({ code: 'DOMAIN_TAKEN', error: 'Domain is already in use' });
        return;
      }

      if (!force) {
        res.status(409).json({
          code: 'DOMAIN_OWN_PROJECT',
          error: `Este domínio está em uso no projeto "${existing.name}"`,
          conflictingProjectName: existing.name,
        });
        return;
      }

      await db.update(projects).set({ customDomain: null }).where(eq(projects.id, existing.id));
      invalidateSiteCache(customDomain);
    }
  }

  await db
    .update(projects)
    .set({ customDomain: customDomain ?? null })
    .where(eq(projects.id, p(req, 'id')));
  res.json({ ok: true });
}

// ─── Palette ──────────────────────────────────────────────────────────────────

export async function getPalette(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const [row] = await db
    .select({ palette: projects.palette })
    .from(projects)
    .where(eq(projects.id, p(req, 'id')))
    .limit(1);

  res.json(row?.palette ?? null);
}

export async function savePalette(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const { palette } = req.body as { palette: { id: string; name: string; value: string; locked?: boolean }[] };
  if (!Array.isArray(palette)) {
    res.status(400).json({ code: 'INVALID_PALETTE', error: 'palette must be an array' });
    return;
  }

  await db
    .update(projects)
    .set({ palette })
    .where(eq(projects.id, p(req, 'id')));
  res.json({ ok: true });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getMessages(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.projectId, p(req, 'id')))
    .orderBy(asc(messages.createdAt));

  res.json(
    rows.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: toMs(m.createdAt),
      images: m.images ?? undefined,
    })),
  );
}

export async function saveMessages(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const { msgs } = req.body as {
    msgs: Array<{ id: string; role: string; content: string; timestamp: number; images?: unknown }>;
  };

  await db.transaction(async (tx) => {
    await tx.delete(messages).where(eq(messages.projectId, p(req, 'id')));
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
      );
    }
  });

  res.json({ ok: true });
}

// ─── Files ─────────────────────────────────────────────────────────────────────

export async function getFiles(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const rows = await db
    .select()
    .from(projectFiles)
    .where(eq(projectFiles.projectId, p(req, 'id')));

  const fileMap: Record<string, string> = {};
  for (const f of rows) fileMap[f.path] = f.code;
  res.json(fileMap);
}

export async function saveFiles(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const files = req.body as Record<string, string>;

  await db.transaction(async (tx) => {
    await tx.delete(projectFiles).where(eq(projectFiles.projectId, p(req, 'id')));
    const entries = Object.entries(files);
    if (entries.length > 0) {
      await tx
        .insert(projectFiles)
        .values(entries.map(([path, code]) => ({ projectId: p(req, 'id'), path, code, updatedAt: new Date() })));
    }
  });

  await db
    .update(projects)
    .set({ updatedAt: new Date() })
    .where(eq(projects.id, p(req, 'id')));
  res.json({ ok: true });
}

// ─── Images ─────────────────────────────────────────────────────────────────────

export async function listImages(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const rows = await db
    .select()
    .from(projectImages)
    .where(eq(projectImages.projectId, p(req, 'id')));

  res.json(rows.map((img) => ({ id: img.id, name: img.name, mediaType: img.mediaType, size: img.size, url: img.url })));
}

export async function uploadImage(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  if (!req.file) {
    res.status(400).json({ code: 'NO_FILE', error: 'No file provided' });
    return;
  }

  try {
    await checkStorageLimit(req.user!.userId, req.file.size);
  } catch (err) {
    if (handlePlanLimit(err, res)) return;
    throw err;
  }

  const url = await uploadFileToPocketBase(req.file.buffer, req.file.originalname, req.file.mimetype, p(req, 'id'));
  const id = crypto.randomUUID();

  await db.insert(projectImages).values({
    id,
    projectId: p(req, 'id'),
    name: req.file.originalname,
    url,
    mediaType: req.file.mimetype,
    size: req.file.size,
  });

  res.json({ id, name: req.file.originalname, url, mediaType: req.file.mimetype, size: req.file.size });
}

export async function renameImage(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const { name } = req.body as { name: string };
  await db
    .update(projectImages)
    .set({ name })
    .where(and(eq(projectImages.id, p(req, 'imageId')), eq(projectImages.projectId, p(req, 'id'))));

  res.json({ ok: true });
}

export async function deleteImage(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const [image] = await db
    .select({ url: projectImages.url })
    .from(projectImages)
    .where(and(eq(projectImages.id, p(req, 'imageId')), eq(projectImages.projectId, p(req, 'id'))))
    .limit(1);

  if (image) await deleteFileFromPocketBase(image.url);

  await db
    .delete(projectImages)
    .where(and(eq(projectImages.id, p(req, 'imageId')), eq(projectImages.projectId, p(req, 'id'))));

  res.json({ ok: true });
}

// ─── Checkpoints ──────────────────────────────────────────────────────────────

export async function listCheckpoints(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const rows = await db
    .select()
    .from(checkpoints)
    .where(eq(checkpoints.projectId, p(req, 'id')))
    .orderBy(asc(checkpoints.createdAt));

  res.json(rows.map((c) => ({ id: c.id, name: c.name, files: c.files, createdAt: toMs(c.createdAt) })));
}

export async function createCheckpoint(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  try {
    await checkCheckpointLimit(req.user!.userId, p(req, 'id'));
  } catch (err) {
    if (handlePlanLimit(err, res)) return;
    throw err;
  }

  const { id, name, files, createdAt } = req.body as {
    id: string;
    name: string;
    files: Record<string, string>;
    createdAt: number;
  };

  await db.insert(checkpoints).values({ id, projectId: p(req, 'id'), name, files, createdAt: new Date(createdAt) });
  res.json({ ok: true });
}

export async function renameCheckpoint(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const { name } = req.body as { name: string };
  await db
    .update(checkpoints)
    .set({ name })
    .where(and(eq(checkpoints.id, p(req, 'checkpointId')), eq(checkpoints.projectId, p(req, 'id'))));

  res.json({ ok: true });
}

export async function deleteCheckpoint(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  await db
    .delete(checkpoints)
    .where(and(eq(checkpoints.id, p(req, 'checkpointId')), eq(checkpoints.projectId, p(req, 'id'))));

  res.json({ ok: true });
}

// ─── Published site ────────────────────────────────────────────────────────────

export async function listPublishedIds(req: Request, res: Response) {
  const rows = await db
    .select({
      projectId: publishedSites.projectId,
      subdomain: publishedSites.subdomain,
      customDomain: projects.customDomain,
    })
    .from(publishedSites)
    .innerJoin(projects, eq(publishedSites.projectId, projects.id))
    .where(eq(projects.userId, req.user!.userId));

  res.json(rows);
}

export async function getPublished(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const [site] = await db
    .select()
    .from(publishedSites)
    .where(eq(publishedSites.projectId, p(req, 'id')))
    .limit(1);

  if (!site) {
    res.status(404).json({ code: 'NOT_PUBLISHED', error: 'Site not published' });
    return;
  }

  const html = site.pbRecordId ? await fetchPublishedSite(site.pbRecordId) : null;

  res.json({
    html: html ?? null,
    publishedAt: site.pbRecordId ? toMs(site.publishedAt) : null,
    subdomainPublishedAt: site.subdomainPublishedAt ? toMs(site.subdomainPublishedAt) : null,
    subdomain: site.subdomain ?? null,
  });
}

export async function publishToDomain(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const { html, publishedAt } = req.body as { html: string; publishedAt: number };

  let pbRecordId: string;
  try {
    pbRecordId = await savePublishedSite(p(req, 'id'), html);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PocketBase save failed';
    console.error('[published] PocketBase save failed:', message);
    res.status(500).json({ code: 'POCKETBASE_ERROR', error: message });
    return;
  }

  await db
    .insert(publishedSites)
    .values({ projectId: p(req, 'id'), pbRecordId, publishedAt: new Date(publishedAt) })
    .onConflictDoUpdate({
      target: publishedSites.projectId,
      set: { pbRecordId, publishedAt: new Date(publishedAt) },
    });

  res.json({ ok: true });
}

export async function publishToSubdomain(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const [site] = await db
    .select({ subdomain: publishedSites.subdomain })
    .from(publishedSites)
    .where(eq(publishedSites.projectId, p(req, 'id')))
    .limit(1);

  if (!site?.subdomain) {
    res.status(400).json({ code: 'NO_SUBDOMAIN', error: 'Claim a subdomain slug before publishing to it' });
    return;
  }

  const { html, publishedAt } = req.body as { html: string; publishedAt: number };

  let subdomainPbRecordId: string;
  try {
    subdomainPbRecordId = await savePublishedSite(p(req, 'id'), html);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PocketBase save failed';
    console.error('[published/subdomain] PocketBase save failed:', message);
    res.status(500).json({ code: 'POCKETBASE_ERROR', error: message });
    return;
  }

  await db
    .update(publishedSites)
    .set({ subdomainPbRecordId, subdomainPublishedAt: new Date(publishedAt) })
    .where(eq(publishedSites.projectId, p(req, 'id')));

  invalidateSubdomainCache(site.subdomain);
  res.json({ ok: true });
}

// ─── Subdomain ────────────────────────────────────────────────────────────────

export async function checkSubdomainAvailability(req: Request, res: Response) {
  const slug = ((req.query.slug as string) ?? '').toLowerCase().trim();

  if (!slug) {
    res.status(400).json({ code: 'MISSING_SLUG', error: 'slug is required' });
    return;
  }

  if (!isValidSubdomain(slug)) {
    res.json({ available: false, reason: 'invalid' });
    return;
  }

  const [existing] = await db
    .select({ projectId: publishedSites.projectId })
    .from(publishedSites)
    .where(eq(publishedSites.subdomain, slug))
    .limit(1);

  res.json({ available: !existing });
}

export async function saveSubdomain(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const slug = ((req.body.subdomain as string) ?? '').toLowerCase().trim();

  if (!slug) {
    res.status(400).json({ code: 'MISSING_SUBDOMAIN', error: 'subdomain is required' });
    return;
  }

  if (!isValidSubdomain(slug)) {
    res.status(400).json({ code: 'INVALID_SUBDOMAIN', error: 'Invalid subdomain' });
    return;
  }

  const [existing] = await db
    .select({ subdomain: publishedSites.subdomain })
    .from(publishedSites)
    .where(eq(publishedSites.projectId, p(req, 'id')))
    .limit(1);

  if (!existing?.subdomain) {
    try {
      await checkPublishAccess(req.user!.userId);
    } catch (err) {
      if (handlePlanLimit(err, res)) return;
      throw err;
    }
  }

  const [conflict] = await db
    .select({ projectId: publishedSites.projectId })
    .from(publishedSites)
    .where(and(eq(publishedSites.subdomain, slug), ne(publishedSites.projectId, p(req, 'id'))))
    .limit(1);

  if (conflict) {
    res.status(409).json({ code: 'SUBDOMAIN_TAKEN', error: 'Subdomain is already taken' });
    return;
  }

  if (existing?.subdomain && existing.subdomain !== slug) {
    invalidateSubdomainCache(existing.subdomain);
  }

  await db
    .insert(publishedSites)
    .values({ projectId: p(req, 'id'), pbRecordId: '', subdomain: slug, publishedAt: new Date(0) })
    .onConflictDoUpdate({ target: publishedSites.projectId, set: { subdomain: slug } });

  res.json({ ok: true, subdomain: slug });
}

// ─── Project-team sharing ─────────────────────────────────────────────────────

export async function listProjectTeams(req: Request, res: Response) {
  if (!(await assertOwnership(p(req, 'id'), req.user!.userId, res))) return;

  const rows = await db
    .select({ teamId: teams.id, name: teams.name })
    .from(projectTeams)
    .innerJoin(teams, eq(teams.id, projectTeams.teamId))
    .where(eq(projectTeams.projectId, p(req, 'id')));

  res.json({ teams: rows });
}

export async function shareWithTeam(req: Request, res: Response) {
  const userId = req.user!.userId;
  const projectId = p(req, 'id');
  const { teamId } = req.body as { teamId: string };

  if (!teamId) {
    res.status(400).json({ code: 'ERROR_MISSING_FIELDS' });
    return;
  }

  // Only the owner (not team members) can share
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    res.status(404).json({ code: 'PROJECT_NOT_FOUND' });
    return;
  }

  // Team must belong to the requesting user
  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.ownerId, userId)))
    .limit(1);

  if (!team) {
    res.status(404).json({ code: 'ERROR_TEAM_NOT_FOUND' });
    return;
  }

  await db.insert(projectTeams).values({ projectId, teamId }).onConflictDoNothing();
  res.status(201).json({ success: true });
}

export async function unshareFromTeam(req: Request, res: Response) {
  const userId = req.user!.userId;
  const projectId = p(req, 'id');
  const { teamId } = req.params;

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    res.status(404).json({ code: 'PROJECT_NOT_FOUND' });
    return;
  }

  await db.delete(projectTeams).where(and(eq(projectTeams.projectId, projectId), eq(projectTeams.teamId, teamId)));
  res.json({ success: true });
}

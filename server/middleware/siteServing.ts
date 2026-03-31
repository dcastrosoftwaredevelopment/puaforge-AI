import { type Request, type Response, type NextFunction } from 'express'
import { LRUCache } from 'lru-cache'
import { eq } from 'drizzle-orm'
import { db } from '../db.js'
import { projects, publishedSites } from '../schema.js'

interface CachedSite {
  html: string
  projectId: string
}

// Cache up to 200 sites in memory, each for 5 minutes
// maxSize caps total RAM at ~100MB (measured in bytes)
const siteCache = new LRUCache<string, CachedSite>({
  max: 200,
  ttl: 5 * 60 * 1000,
  maxSize: 100 * 1024 * 1024,
  sizeCalculation: (entry) => entry.html.length,
})

/** Called by publish route to invalidate the cache for a domain immediately */
export function invalidateSiteCache(domain: string) {
  siteCache.delete(domain)
}

/**
 * Intercepts requests from custom domains and serves the published HTML.
 * Must be mounted BEFORE all /api routes in server/index.ts.
 *
 * Detection: if the Host header does not match APP_DOMAIN (env var),
 * treat it as a custom project domain.
 */
export async function siteServingMiddleware(req: Request, res: Response, next: NextFunction) {
  const appDomain = process.env.APP_DOMAIN ?? ''
  const host = (req.hostname ?? '').toLowerCase().replace(/:\d+$/, '')

  // Pass through if it's the app's own domain or no domain configured
  if (!host || !appDomain || host === appDomain || host.endsWith(`.${appDomain}`)) {
    return next()
  }

  // Check cache first
  const cached = siteCache.get(host)
  if (cached) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.setHeader('X-Served-By', 'PuaForge')
    return res.send(cached.html)
  }

  // Lookup in DB
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.customDomain, host))
    .limit(1)

  if (!project) return next()

  const [site] = await db
    .select({ html: publishedSites.html })
    .from(publishedSites)
    .where(eq(publishedSites.projectId, project.id))
    .limit(1)

  if (!site) {
    res.status(404).send('<html><body><p>Este site ainda não foi publicado.</p></body></html>')
    return
  }

  siteCache.set(host, { html: site.html, projectId: project.id })

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=300')
  res.setHeader('X-Served-By', 'PuaForge')
  res.send(site.html)
}

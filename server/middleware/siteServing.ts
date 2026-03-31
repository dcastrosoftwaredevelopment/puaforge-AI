import { type Request, type Response, type NextFunction } from 'express'
import { LRUCache } from 'lru-cache'
import { eq } from 'drizzle-orm'
import { db } from '../db.js'
import { projects, publishedSites } from '../schema.js'
import { fetchPublishedSite } from '../services/pocketbase.js'

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

/** Called by publish route to invalidate the cache for a custom domain immediately */
export function invalidateSiteCache(domain: string) {
  siteCache.delete(domain)
}

/** Called by publish route to invalidate the cache for a subdomain immediately */
export function invalidateSubdomainCache(subdomain: string) {
  siteCache.delete(`sub:${subdomain}`)
}

async function serveSite(cacheKey: string, pbRecordId: string, projectId: string, res: Response) {
  const html = await fetchPublishedSite(pbRecordId)
  if (!html) {
    res.status(404).send('<html><body><p>Arquivo do site não encontrado.</p></body></html>')
    return
  }
  siteCache.set(cacheKey, { html, projectId })
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=300')
  res.setHeader('X-Served-By', 'PuaForge')
  res.send(html)
}

/**
 * Intercepts requests from custom domains and subdomains, serving the published HTML.
 * Must be mounted BEFORE all /api routes in server/index.ts.
 *
 * - Subdomain of APP_DOMAIN (e.g. mysite.puaforge.com) → look up by subdomain column
 * - Any other domain (e.g. mysite.com) → look up by customDomain column
 * - The root APP_DOMAIN itself always passes through to the app
 */
export async function siteServingMiddleware(req: Request, res: Response, next: NextFunction) {
  const appDomain = process.env.APP_DOMAIN ?? ''
  const host = (req.hostname ?? '').toLowerCase().replace(/:\d+$/, '')

  // Always pass through root app domain
  if (!host || !appDomain || host === appDomain) return next()

  // Handle subdomains of app domain (e.g. mysite.puaforge.com)
  if (host.endsWith(`.${appDomain}`)) {
    const subdomain = host.slice(0, host.length - appDomain.length - 1)
    const cacheKey = `sub:${subdomain}`

    const cached = siteCache.get(cacheKey)
    if (cached) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=300')
      res.setHeader('X-Served-By', 'PuaForge')
      return res.send(cached.html)
    }

    const [site] = await db
      .select({ pbRecordId: publishedSites.pbRecordId, projectId: publishedSites.projectId })
      .from(publishedSites)
      .where(eq(publishedSites.subdomain, subdomain))
      .limit(1)

    if (!site) return next()

    await serveSite(cacheKey, site.pbRecordId, site.projectId, res)
    return
  }

  // Handle fully custom domains (e.g. mysite.com)
  const cached = siteCache.get(host)
  if (cached) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.setHeader('X-Served-By', 'PuaForge')
    return res.send(cached.html)
  }

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.customDomain, host))
    .limit(1)

  if (!project) return next()

  const [site] = await db
    .select({ pbRecordId: publishedSites.pbRecordId })
    .from(publishedSites)
    .where(eq(publishedSites.projectId, project.id))
    .limit(1)

  if (!site) {
    res.status(404).send('<html><body><p>Este site ainda não foi publicado.</p></body></html>')
    return
  }

  await serveSite(host, site.pbRecordId, project.id, res)
}

import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function extractImageUrls(html: string, baseUrl?: string): string[] {
  const urls = new Set<string>()

  // <img src="...">
  const imgSrcRe = /<img[^>]+src=["']([^"'\s>]+)["']/gi
  let m: RegExpExecArray | null
  while ((m = imgSrcRe.exec(html)) !== null) urls.add(m[1])

  // url(...) in <style> tags and style="" attributes
  const cssUrlRe = /url\(["']?([^"')]+)["']?\)/gi
  while ((m = cssUrlRe.exec(html)) !== null) {
    if (!m[1].startsWith('data:')) urls.add(m[1])
  }

  // srcset — take first entry
  const srcsetRe = /srcset=["']([^"']+)["']/gi
  while ((m = srcsetRe.exec(html)) !== null) {
    const first = m[1].trim().split(/\s*,\s*/)[0]?.split(/\s+/)[0]
    if (first) urls.add(first)
  }

  // <meta property="og:image">
  const ogRe = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi
  while ((m = ogRe.exec(html)) !== null) urls.add(m[1])

  if (baseUrl) {
    const base = new URL(baseUrl)
    return Array.from(urls)
      .map((u) => {
        try { return new URL(u, base).href } catch { return null }
      })
      .filter((u): u is string => u !== null && !u.startsWith('data:'))
  }

  return Array.from(urls).filter((u) => /^https?:\/\//.test(u) || u.startsWith('//'))
}

function suggestName(url: string, index: number): string {
  try {
    const pathname = new URL(url.startsWith('//') ? `https:${url}` : url).pathname
    const filename = pathname.split('/').pop() ?? ''
    const clean = filename.replace(/[?#].*$/, '').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 60)
    if (clean && /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(clean)) return clean
  } catch { /* ignore */ }
  return `image-${index + 1}.jpg`
}

router.post('/import-site', requireAuth, async (req, res) => {
  try {
    const { url, htmlContent } = req.body as { url?: string; htmlContent?: string }

    let html: string
    let baseUrl: string | undefined

    if (url) {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PuaForge/1.0)' },
        signal: AbortSignal.timeout(15_000),
      })
      if (!response.ok) {
        res.status(400).json({ error: `Could not fetch URL: HTTP ${response.status}` })
        return
      }
      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.includes('html')) {
        res.status(400).json({ error: 'URL does not point to an HTML page' })
        return
      }
      html = await response.text()
      baseUrl = url
    } else if (htmlContent) {
      html = htmlContent
    } else {
      res.status(400).json({ error: 'Provide url or htmlContent' })
      return
    }

    const imageUrls = extractImageUrls(html, baseUrl).slice(0, 25)

    const settled = await Promise.allSettled(
      imageUrls.map(async (imgUrl, i) => {
        try {
          const r = await fetch(imgUrl.startsWith('//') ? `https:${imgUrl}` : imgUrl, {
            signal: AbortSignal.timeout(8_000),
          })
          if (!r.ok) return null
          const contentType = r.headers.get('content-type') ?? ''
          if (!contentType.startsWith('image/')) return null
          const buffer = Buffer.from(await r.arrayBuffer())
          if (buffer.length > 4 * 1024 * 1024) return null // skip >4MB
          return {
            originalUrl: imgUrl,
            base64: buffer.toString('base64'),
            mediaType: contentType.split(';')[0].trim(),
            suggestedName: suggestName(imgUrl, i),
          }
        } catch {
          return null
        }
      }),
    )

    const images = settled
      .map((r) => (r.status === 'fulfilled' ? r.value : null))
      .filter((x): x is NonNullable<typeof x> => x !== null)

    res.json({ html, images })
  } catch (err) {
    console.error('[import-site]', err)
    res.status(500).json({ error: 'Failed to import site' })
  }
})

export { router as importSiteRoute }

import { type Request, type Response } from 'express';
import { checkImportLimit, incrementImportCount, PlanLimitError } from '../services/plans.js';

interface ExtractedDataUrl {
  base64: string;
  mediaType: string;
  index: number;
}

/**
 * Extracts inline base64 data URLs from img src attributes.
 * Returns them separately so they can be uploaded as project images,
 * and replaces them in the HTML with a placeholder to avoid sending
 * huge base64 blobs to the AI.
 */
function extractAndStripDataUrls(html: string): { html: string; dataImages: ExtractedDataUrl[] } {
  const dataImages: ExtractedDataUrl[] = [];
  let index = 0;

  const result = html.replace(
    /(<img[^>]+src=["'])(data:([^;]+);base64,([^"']+))(["'][^>]*>)/gi,
    (_match, before, _dataUrl, mediaType, base64, after) => {
      dataImages.push({ base64, mediaType, index: index++ });
      return `${before}[data-image-${index - 1}]${after}`;
    },
  );

  return { html: result, dataImages };
}

function extractImageUrls(html: string, baseUrl?: string): string[] {
  const urls = new Set<string>();

  const imgSrcRe = /<img[^>]+src=["']([^"'\s>]+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = imgSrcRe.exec(html)) !== null) {
    if (!m[1].startsWith('data:')) urls.add(m[1]);
  }

  const cssUrlRe = /url\(["']?([^"')]+)["']?\)/gi;
  while ((m = cssUrlRe.exec(html)) !== null) {
    if (!m[1].startsWith('data:')) urls.add(m[1]);
  }

  const srcsetRe = /srcset=["']([^"']+)["']/gi;
  while ((m = srcsetRe.exec(html)) !== null) {
    const first = m[1]
      .trim()
      .split(/\s*,\s*/)[0]
      ?.split(/\s+/)[0];
    if (first) urls.add(first);
  }

  const ogRe = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
  while ((m = ogRe.exec(html)) !== null) urls.add(m[1]);

  if (baseUrl) {
    const base = new URL(baseUrl);
    return Array.from(urls)
      .map((u) => {
        try {
          return new URL(u, base).href;
        } catch {
          return null;
        }
      })
      .filter((u): u is string => u !== null && !u.startsWith('data:'));
  }

  return Array.from(urls).filter((u) => /^https?:\/\//.test(u) || u.startsWith('//'));
}

/**
 * Aggressively strips noise from HTML before sending to the AI.
 * Returns cleaned HTML and a flag indicating if the page is a JS-rendered SPA.
 */
function cleanHtml(html: string): { html: string; isSpa: boolean } {
  let cleaned = html;

  cleaned = cleaned.replace(/<head[\s\S]*?<\/head>/gi, (head) => {
    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[0] ?? '';
    const desc = /<meta[^>]+name=["']description["'][^>]*>/i.exec(head)?.[0] ?? '';
    return `<head>${title}${desc}</head>`;
  });

  let prev = '';
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, (match) => {
      const src = /\bsrc=["']([^"']+)["']/.exec(match)?.[1];
      return src ? `<!-- script: ${src} -->` : '';
    });
  }

  cleaned = cleaned
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<template[\s\S]*?<\/template>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '');

  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  cleaned = cleaned.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
  cleaned = cleaned.replace(
    /\s+(?:integrity|nonce|crossorigin|data-[\w:-]+|aria-hidden)\s*=\s*(?:"[^"]*"|'[^']*')/gi,
    '',
  );
  cleaned = cleaned.replace(/\s+style\s*=\s*"[^"]{150,}"/gi, '');
  cleaned = cleaned.replace(/\s+style\s*=\s*'[^']{150,}'/gi, '');
  cleaned = cleaned.replace(/<(?:div|span|p|section|article)\s*><\/(?:div|span|p|section|article)>/gi, '');
  cleaned = cleaned
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const bodyInner = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(cleaned)?.[1] ?? cleaned;
  const visibleText = bodyInner
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const isSpa = visibleText.length < 200;

  return { html: cleaned, isSpa };
}

function suggestName(url: string, index: number): string {
  try {
    const pathname = new URL(url.startsWith('//') ? `https:${url}` : url).pathname;
    const filename = pathname.split('/').pop() ?? '';
    const clean = filename
      .replace(/[?#].*$/, '')
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .slice(0, 60);
    if (clean && /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(clean)) return clean;
  } catch {
    /* ignore */
  }
  return `image-${index + 1}.jpg`;
}

export async function importSite(req: Request, res: Response) {
  try {
    try {
      await checkImportLimit(req.user!.userId);
    } catch (err) {
      if (err instanceof PlanLimitError) {
        res.status(403).json({
          error: err.message,
          upgradeRequired: true,
          requiredPlan: err.requiredPlan,
          limitType: err.limitType,
        });
        return;
      }
      throw err;
    }

    const { url, htmlContent } = req.body as { url?: string; htmlContent?: string };

    let html: string;
    let baseUrl: string | undefined;

    if (url) {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PuaForge/1.0)' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        res.status(400).json({ code: 'FETCH_FAILED', error: `Could not fetch URL: HTTP ${response.status}` });
        return;
      }
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('html')) {
        res.status(400).json({ code: 'NOT_HTML', error: 'URL does not point to an HTML page' });
        return;
      }
      html = await response.text();
      baseUrl = url;
    } else if (htmlContent) {
      html = htmlContent;
    } else {
      res.status(400).json({ code: 'MISSING_INPUT', error: 'Provide url or htmlContent' });
      return;
    }

    const { html: htmlWithoutDataUrls, dataImages } = extractAndStripDataUrls(html);
    const imageUrls = extractImageUrls(htmlWithoutDataUrls, baseUrl).slice(0, 25);

    const settled = await Promise.allSettled(
      imageUrls.map(async (imgUrl, i) => {
        try {
          const r = await fetch(imgUrl.startsWith('//') ? `https:${imgUrl}` : imgUrl, {
            signal: AbortSignal.timeout(8_000),
          });
          if (!r.ok) return null;
          const contentType = r.headers.get('content-type') ?? '';
          if (!contentType.startsWith('image/')) return null;
          const buffer = Buffer.from(await r.arrayBuffer());
          if (buffer.length > 4 * 1024 * 1024) return null;
          return {
            originalUrl: imgUrl,
            base64: buffer.toString('base64'),
            mediaType: contentType.split(';')[0].trim(),
            suggestedName: suggestName(imgUrl, i),
          };
        } catch {
          return null;
        }
      }),
    );

    const fetchedImages = settled
      .map((r) => (r.status === 'fulfilled' ? r.value : null))
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const dataUrlImages = dataImages
      .filter((d) => Buffer.from(d.base64, 'base64').length <= 4 * 1024 * 1024)
      .map((d, i) => ({
        originalUrl: `data:${d.mediaType};base64,...`,
        base64: d.base64,
        mediaType: d.mediaType,
        suggestedName: `image-inline-${i + 1}.${d.mediaType.split('/')[1] ?? 'jpg'}`,
      }));

    const images = [...fetchedImages, ...dataUrlImages];

    const { html: cleanedHtml, isSpa } = cleanHtml(htmlWithoutDataUrls);
    const warning =
      isSpa ?
        'This page appears to be a JavaScript-rendered app (SPA). No static HTML content was found — the AI will have limited information to work with.'
      : undefined;

    console.log(`[import-site] cleaned html: ${cleanedHtml.length} chars${isSpa ? ' (SPA detected)' : ''}`);
    await incrementImportCount(req.user!.userId);
    res.json({ html: cleanedHtml, images, warning });
  } catch (err) {
    console.error('[import-site]', err);
    res.status(500).json({ code: 'IMPORT_ERROR', error: 'Failed to import site' });
  }
}

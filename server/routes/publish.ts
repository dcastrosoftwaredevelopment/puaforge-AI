import { Router, type Request, type Response } from 'express'
import * as esbuild from 'esbuild'
import { eq } from 'drizzle-orm'
import { db } from '../db.js'
import { projects } from '../schema.js'
import { invalidateSiteCache } from '../middleware/siteServing.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

interface PublishBody {
  projectId: string
  files: Record<string, string>
}

/**
 * esbuild plugin that resolves imports from the virtual file map.
 */
function virtualFilesPlugin(files: Record<string, string>): esbuild.Plugin {
  return {
    name: 'virtual-files',
    setup(build) {
      build.onResolve({ filter: /^__entry__$/ }, () => {
        return { path: '/__entry__.tsx', namespace: 'virtual' }
      })

      build.onResolve({ filter: /^\./ }, (args) => {
        const dir = args.importer ? args.importer.replace(/\/[^/]+$/, '') : ''
        const resolved = normalizePath(dir + '/' + args.path)

        const extensions = ['', '.tsx', '.ts', '.jsx', '.js']
        for (const ext of extensions) {
          const candidate = resolved + ext
          if (files[candidate]) {
            return { path: candidate, namespace: 'virtual' }
          }
        }
        for (const ext of extensions) {
          const candidate = resolved + '/index' + ext
          if (files[candidate]) {
            return { path: candidate, namespace: 'virtual' }
          }
        }

        return undefined
      })

      build.onResolve({ filter: /^[^./]/ }, (args) => {
        return { path: args.path, external: true }
      })

      build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => {
        const content = files[args.path]
        if (content === undefined) return undefined

        let loader: esbuild.Loader = 'tsx'
        if (args.path.endsWith('.ts')) loader = 'ts'
        else if (args.path.endsWith('.js')) loader = 'js'
        else if (args.path.endsWith('.jsx')) loader = 'jsx'
        else if (args.path.endsWith('.css')) loader = 'css'

        return { contents: content, loader }
      })
    },
  }
}

function normalizePath(p: string): string {
  const parts = p.split('/')
  const result: string[] = []
  for (const part of parts) {
    if (part === '..') result.pop()
    else if (part !== '.' && part !== '') result.push(part)
  }
  return '/' + result.join('/')
}

router.post('/publish', requireAuth, async (req: Request<object, object, PublishBody>, res: Response) => {
  const { projectId, files } = req.body

  if (!projectId || !files) {
    res.status(400).json({ code: 'MISSING_FIELDS', error: 'projectId and files are required' })
    return
  }

  try {
    const [project] = await db
      .select({ name: projects.name, customDomain: projects.customDomain })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)

    const projectName = project?.name ?? 'Site Publicado'

    const projectFiles: Record<string, string> = {}
    for (const [path, code] of Object.entries(files)) {
      if (path !== '/index.html') {
        projectFiles[path] = code
      }
    }

    projectFiles['/__entry__.tsx'] = `
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
createRoot(document.getElementById('root')!).render(React.createElement(App))
`

    const result = await esbuild.build({
      entryPoints: ['__entry__'],
      plugins: [virtualFilesPlugin(projectFiles)],
      bundle: true,
      format: 'esm',
      write: false,
      minify: true,
      jsx: 'automatic',
      target: 'es2020',
      metafile: true,
    })

    const bundledJs = result.outputFiles[0].text

    // Use esbuild metafile to get the exact set of external imports in the bundle
    const externalPkgs = new Set<string>()
    for (const output of Object.values(result.metafile.outputs)) {
      for (const imp of output.imports) {
        if (imp.external) externalPkgs.add(imp.path)
      }
    }
    const allPkgs = new Set(['react', 'react-dom', 'react-dom/client', ...externalPkgs])

    const importMap: Record<string, string> = {}
    for (const pkg of allPkgs) {
      importMap[pkg] = `https://esm.sh/${pkg}`
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script type="importmap">
    ${JSON.stringify({ imports: importMap }, null, 2)}
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
${bundledJs}
  </script>
</body>
</html>`

    console.log(`[publish] Site built for project: ${projectId}`)

    // Invalidate site cache for this project's custom domain (if any)
    if (project?.customDomain) {
      invalidateSiteCache(project.customDomain)
    }

    res.json({ html, publishedAt: Date.now() })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[publish] Build error:', message)
    res.status(500).json({ code: 'BUILD_ERROR', error: message })
  }
})

export { router as publishRoute }

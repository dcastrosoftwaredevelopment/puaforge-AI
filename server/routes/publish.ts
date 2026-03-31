import { Router, type Request, type Response } from 'express'
import * as esbuild from 'esbuild'
import { eq } from 'drizzle-orm'
import { db } from '../db.js'
import { projects } from '../schema.js'
import { invalidateSiteCache } from '../middleware/siteServing.js'

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

function collectExternalImports(files: Record<string, string>): string[] {
  const imports = new Set<string>()
  const importRegex = /(?:import|from)\s+['"]([^./'][^'"]*)['"]/g

  for (const code of Object.values(files)) {
    let match
    while ((match = importRegex.exec(code)) !== null) {
      const full = match[1]
      const pkg = full.startsWith('@') ? full.split('/').slice(0, 2).join('/') : full.split('/')[0]
      imports.add(pkg)
    }
  }

  return Array.from(imports)
}

router.post('/publish', async (req: Request<object, object, PublishBody>, res: Response) => {
  const { projectId, files } = req.body

  if (!projectId || !files) {
    res.status(400).json({ error: 'projectId and files are required' })
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
    })

    const bundledJs = result.outputFiles[0].text

    const externalPkgs = collectExternalImports(projectFiles)
    const allPkgs = new Set(['react', 'react-dom', ...externalPkgs])
    allPkgs.add('react-dom/client')
    allPkgs.add('react/jsx-runtime')

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
    res.status(500).json({ error: message })
  }
})

export { router as publishRoute }

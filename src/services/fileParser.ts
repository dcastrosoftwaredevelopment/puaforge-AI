/**
 * Detects if a code string is a placeholder stub (auto-generated or "em construção").
 */
function isStub(code: string): boolean {
  return /em construção/i.test(code) ||
    /placeholder/i.test(code) ||
    code.split('\n').length <= 8
}

/**
 * Smart merge: merges new AI-generated files into existing project files.
 * Protects existing real implementations from being overwritten by stubs.
 */
export function mergeFiles(
  existing: Record<string, string>,
  incoming: Record<string, string>,
): Record<string, string> {
  const merged = { ...existing }

  for (const [path, code] of Object.entries(incoming)) {
    const prev = existing[path]

    // No existing file — always accept
    if (!prev) {
      merged[path] = code
      continue
    }

    // If the incoming file is a stub but the existing one isn't, keep existing
    if (isStub(code) && !isStub(prev)) {
      console.log(`[mergeFiles] Skipping stub for ${path} — keeping existing implementation`)
      continue
    }

    // Otherwise accept the new version
    merged[path] = code
  }

  return merged
}

/**
 * Parses AI response to extract file blocks.
 * Expected format:
 * ```tsx file="/App.tsx"
 * // code here
 * ```
 */
export function parseFilesFromResponse(response: string): Record<string, string> {
  const files: Record<string, string> = {}
  const regex = /```[\w]*\s+file="([^"]+)"\n([\s\S]*?)```/g

  let match: RegExpExecArray | null
  while ((match = regex.exec(response)) !== null) {
    const [, filePath, code] = match
    files[filePath] = code.trim()
  }

  return addMissingStubs(files)
}

/**
 * Scans all files for relative imports and generates stub components
 * for any that are missing, preventing Sandpack "module not found" errors.
 */
function addMissingStubs(files: Record<string, string>): Record<string, string> {
  const importRegex = /import\s+\w+\s+from\s+['"](\.[^'"]+)['"]/g
  const result = { ...files }

  for (const [filePath, code] of Object.entries(files)) {
    let importMatch: RegExpExecArray | null
    while ((importMatch = importRegex.exec(code)) !== null) {
      const importPath = importMatch[1]
      const resolvedPath = resolveImport(filePath, importPath)

      if (!result[resolvedPath]) {
        const componentName = resolvedPath.split('/').pop()?.replace(/\.\w+$/, '') ?? 'Component'
        result[resolvedPath] = `export default function ${componentName}() {
  return (
    <div className="p-4 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#151620]">
      <p className="text-[#64748b] text-sm">${componentName} — em construção</p>
    </div>
  )
}`
      }
    }
  }

  return result
}

/**
 * Scans all project files and extracts external npm dependencies.
 * Returns a Record<packageName, "latest"> for use in Sandpack's customSetup.dependencies.
 */
export function extractDependencies(files: Record<string, string>): Record<string, string> {
  const deps: Record<string, string> = {}
  // Matches: import ... from 'package' or import 'package'
  const importRegex = /import\s+(?:[\w{},*\s]+\s+from\s+)?['"]([^'"./][^'"]*)['"]/g

  // Built-in modules that Sandpack already provides
  const builtIn = new Set(['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'])

  for (const code of Object.values(files)) {
    let match: RegExpExecArray | null
    while ((match = importRegex.exec(code)) !== null) {
      const specifier = match[1]
      // Get the package name (handle scoped packages like @org/pkg)
      const pkgName = specifier.startsWith('@')
        ? specifier.split('/').slice(0, 2).join('/')
        : specifier.split('/')[0]

      if (!builtIn.has(pkgName) && !builtIn.has(specifier)) {
        deps[pkgName] = 'latest'
      }
    }
  }

  return deps
}

/**
 * Resolves a relative import path to an absolute file path.
 * e.g. ('/pages/LandingPage.tsx', '../components/Hero') → '/components/Hero.tsx'
 */
function resolveImport(fromFile: string, importPath: string): string {
  const fromDir = fromFile.substring(0, fromFile.lastIndexOf('/'))
  const parts = [...fromDir.split('/'), ...importPath.split('/')]
  const resolved: string[] = []

  for (const part of parts) {
    if (part === '.' || part === '') continue
    if (part === '..') {
      resolved.pop()
    } else {
      resolved.push(part)
    }
  }

  const path = '/' + resolved.join('/')

  // Add .tsx extension if missing
  if (!/\.\w+$/.test(path)) {
    return path + '.tsx'
  }
  return path
}

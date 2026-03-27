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

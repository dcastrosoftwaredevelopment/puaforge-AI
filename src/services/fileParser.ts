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

  return files
}

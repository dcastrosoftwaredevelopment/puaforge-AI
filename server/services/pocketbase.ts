/**
 * PocketBase admin client for server-side file operations.
 * Credentials are kept on the server — never exposed to the frontend.
 */

const PB_URL = process.env.POCKETBASE_URL ?? 'http://localhost:8090'
const PB_PUBLIC_URL = process.env.POCKETBASE_PUBLIC_URL ?? PB_URL
const PB_COLLECTION = 'project_images'

let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getAdminToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken

  const email = process.env.PB_ADMIN_EMAIL
  const password = process.env.PB_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error('PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD must be set in environment variables')
  }

  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.message ?? `PocketBase auth failed: HTTP ${res.status}`)
  }

  const data = await res.json() as { token: string }
  cachedToken = data.token
  // Tokens last ~7 days; refresh after 6 days
  tokenExpiresAt = Date.now() + 6 * 24 * 60 * 60 * 1000
  return cachedToken
}

export async function uploadFileToPocketBase(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  projectId: string,
): Promise<string> {
  const token = await getAdminToken()

  const formData = new FormData()
  formData.append('file', new Blob([new Uint8Array(fileBuffer)], { type: mimeType }), fileName)
  formData.append('projectId', projectId)

  const res = await fetch(`${PB_URL}/api/collections/${PB_COLLECTION}/records`, {
    method: 'POST',
    headers: { Authorization: token },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.message ?? 'PocketBase upload failed')
  }

  const record = await res.json() as { id: string; file: string; collectionId: string }
  return `${PB_PUBLIC_URL}/api/files/${record.collectionId}/${record.id}/${record.file}`
}

export async function deleteFileFromPocketBase(imageUrl: string): Promise<void> {
  // URL format: {PB_URL}/api/files/{collectionId}/{recordId}/{filename}
  const recordId = imageUrl.split('/').at(-2)
  if (!recordId) return

  try {
    const token = await getAdminToken()
    await fetch(`${PB_URL}/api/collections/${PB_COLLECTION}/records/${recordId}`, {
      method: 'DELETE',
      headers: { Authorization: token },
    })
  } catch {
    // Non-critical: log and continue even if PocketBase delete fails
    console.warn(`Failed to delete PocketBase record for URL: ${imageUrl}`)
  }
}

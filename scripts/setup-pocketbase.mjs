/**
 * Creates the required PocketBase collection for image uploads.
 * Run once after starting PocketBase for the first time:
 *
 *   node scripts/setup-pocketbase.mjs
 *
 * Requires POCKETBASE_URL, PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD in .env
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Parse .env manually (no external deps)
function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf-8')
    const env = {}
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const [key, ...rest] = trimmed.split('=')
      env[key.trim()] = rest.join('=').trim()
    }
    return env
  } catch {
    return {}
  }
}

const env = loadEnv()
const PB_URL = env.POCKETBASE_URL || 'http://localhost:8090'
const ADMIN_EMAIL = env.PB_ADMIN_EMAIL
const ADMIN_PASSWORD = env.PB_ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌  Set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD in your .env file.')
  process.exit(1)
}

async function request(path, options = {}) {
  const res = await fetch(`${PB_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`)
  return json
}

async function main() {
  console.log(`Connecting to PocketBase at ${PB_URL}...`)

  // 1. Authenticate as superuser (PocketBase v0.23+)
  const auth = await request('/api/collections/_superusers/auth-with-password', {
    method: 'POST',
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  const token = auth.token ?? auth.record?.token
  console.log('✓ Authenticated as admin')

  const authHeader = { Authorization: token }

  // 2. Check if collection already exists
  const collections = await request('/api/collections?perPage=200', { headers: authHeader })
  const existing = collections.items?.find((c) => c.name === 'project_images')

  if (existing) {
    console.log('✓ Collection "project_images" already exists — nothing to do.')
    return
  }

  // 3. Create the collection
  await request('/api/collections', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      name: 'project_images',
      type: 'base',
      schema: [
        {
          name: 'file',
          type: 'file',
          required: true,
          options: { maxSelect: 1, maxSize: 10485760 }, // 10 MB
        },
        {
          name: 'projectId',
          type: 'text',
          required: true,
        },
      ],
      // Allow anyone to create (upload from browser without auth)
      createRule: '',
      listRule: '',
      viewRule: '',
      updateRule: null,
      deleteRule: null,
    }),
  })

  console.log('✓ Collection "project_images" created successfully.')
  console.log('')
  console.log('Setup complete! You can now upload images from the app.')
}

main().catch((err) => {
  console.error('❌ Setup failed:', err.message)
  process.exit(1)
})

/**
 * PocketBase admin client for server-side file operations.
 * Credentials are kept on the server — never exposed to the frontend.
 */

const PB_URL = process.env.POCKETBASE_URL ?? 'http://localhost:8090';
const PB_PUBLIC_URL = process.env.POCKETBASE_PUBLIC_URL ?? PB_URL;
const PB_COLLECTION = 'project_images';
const PB_SITES_COLLECTION = 'published_sites';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAdminToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const email = process.env.PB_ADMIN_EMAIL;
  const password = process.env.PB_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD must be set in environment variables');
  }

  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? `PocketBase auth failed: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { token: string };
  cachedToken = data.token;
  // Tokens last ~7 days; refresh after 6 days
  tokenExpiresAt = Date.now() + 6 * 24 * 60 * 60 * 1000;
  return cachedToken;
}

export async function uploadFileToPocketBase(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  projectId: string,
): Promise<string> {
  const token = await getAdminToken();

  const formData = new FormData();
  formData.append('file', new Blob([new Uint8Array(fileBuffer)], { type: mimeType }), fileName);
  formData.append('projectId', projectId);

  const res = await fetch(`${PB_URL}/api/collections/${PB_COLLECTION}/records`, {
    method: 'POST',
    headers: { Authorization: token },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? 'PocketBase upload failed');
  }

  const record = (await res.json()) as { id: string; file: string; collectionId: string };
  return `${PB_PUBLIC_URL}/api/files/${record.collectionId}/${record.id}/${record.file}`;
}

/**
 * Saves (upsert) published HTML for a project in PocketBase.
 * Uses a record per projectId — updates if exists, creates if not.
 * Returns the PocketBase record ID.
 */
export async function savePublishedSite(projectId: string, html: string): Promise<string> {
  const token = await getAdminToken();

  // Check if a record already exists for this projectId
  const listRes = await fetch(
    `${PB_URL}/api/collections/${PB_SITES_COLLECTION}/records?filter=(projectId="${projectId}")&perPage=1`,
    { headers: { Authorization: token } },
  );
  const listData = (await listRes.json()) as { items: { id: string }[] };
  const existingId = listData.items?.[0]?.id ?? null;

  const formData = new FormData();
  formData.append('html', new Blob([html], { type: 'text/html' }), `${projectId}.html`);
  formData.append('projectId', projectId);

  const url =
    existingId ?
      `${PB_URL}/api/collections/${PB_SITES_COLLECTION}/records/${existingId}`
    : `${PB_URL}/api/collections/${PB_SITES_COLLECTION}/records`;
  const method = existingId ? 'PATCH' : 'POST';

  const res = await fetch(url, { method, headers: { Authorization: token }, body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message ?? 'PocketBase site save failed');
  }

  const record = (await res.json()) as { id: string };
  return record.id;
}

/**
 * Fetches published HTML for a project from PocketBase by record ID.
 */
export async function fetchPublishedSite(pbRecordId: string): Promise<string | null> {
  const token = await getAdminToken();

  const res = await fetch(`${PB_URL}/api/collections/${PB_SITES_COLLECTION}/records/${pbRecordId}`, {
    headers: { Authorization: token },
  });
  if (!res.ok) return null;

  const record = (await res.json()) as { html: string; collectionId: string; id: string };
  // Fetch the actual HTML file content
  const htmlUrl = `${PB_URL}/api/files/${record.collectionId}/${record.id}/${record.html}`;
  const htmlRes = await fetch(htmlUrl, { headers: { Authorization: token } });
  if (!htmlRes.ok) return null;
  return htmlRes.text();
}

export async function deleteFileFromPocketBase(imageUrl: string): Promise<void> {
  // URL format: {PB_URL}/api/files/{collectionId}/{recordId}/{filename}
  const recordId = imageUrl.split('/').at(-2);
  if (!recordId) return;

  try {
    const token = await getAdminToken();
    await fetch(`${PB_URL}/api/collections/${PB_COLLECTION}/records/${recordId}`, {
      method: 'DELETE',
      headers: { Authorization: token },
    });
  } catch {
    // Non-critical: log and continue even if PocketBase delete fails
    console.warn(`Failed to delete PocketBase record for URL: ${imageUrl}`);
  }
}

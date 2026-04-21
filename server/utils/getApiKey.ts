/**
 * Gets the Anthropic API key from the request header (frontend-configured).
 * No .env fallback — the key must be configured in Settings.
 */
export function getApiKey(req: { headers: Record<string, string | string[] | undefined> }): string | undefined {
  return req.headers['x-api-key'] as string | undefined;
}

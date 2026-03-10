/**
 * CORS utility — restricts API access to known origins.
 *
 * Why not '*':
 *   An open CORS policy allows any website to call our API endpoints,
 *   which enables mass account creation, quota exhaustion, and scraping.
 *
 * Why allow all chrome-extension:// origins:
 *   The extension ID differs per install (dev vs production) and we can't
 *   enumerate all valid IDs. Extensions are sandboxed by Chrome anyway.
 *
 * Background service workers have no Origin header — we allow null origins
 * for API routes (they can't be called from the browser without an origin).
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://backend-gules-sigma-37.vercel.app'

export function getAllowedOrigin(req: { headers: { get: (k: string) => string | null } }): string {
  const origin = req.headers.get('origin') ?? ''

  // Requests with no Origin header: server-to-server or extension background service worker.
  // These cannot be initiated from a browser cross-origin context so ACAO: * is safe here.
  // We return the backend URL so CDN caches don't mix credentialed/non-credentialed responses.
  if (!origin) return BACKEND_URL

  // Chrome extension (sidebar, popup) — IDs vary, allow all chrome-extension:// origins
  if (origin.startsWith('chrome-extension://')) return origin

  // Gmail (content scripts calling from mail.google.com context)
  if (origin === 'https://mail.google.com') return origin

  // Our own frontend (signup page, upgrade page)
  if (origin === BACKEND_URL) return origin

  // Unknown origin — block via CORS (do not echo it back)
  return 'null'
}

export function buildCorsHeaders(req: { headers: { get: (k: string) => string | null } }, methods = 'POST, OPTIONS'): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

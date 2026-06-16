/**
 * CORS utility for GuardScope APIs.
 *
 * Production only echoes the website, Gmail, and the published extension ID.
 * Development can still use unpacked extension builds without blocking local
 * testing.
 */

const CANONICAL_SITE_ORIGIN = 'https://guardscope.app'
const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL ?? CANONICAL_SITE_ORIGIN
const PUBLISHED_EXTENSION_ID = 'fbjajjiepjmcmkcidfbmjbjmmegokhif'

function isProductionRuntime() {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
}

function allowedExtensionOrigins() {
  const configured = process.env.ALLOWED_CHROME_EXTENSION_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []

  return new Set([
    `chrome-extension://${PUBLISHED_EXTENSION_ID}`,
    ...configured,
  ])
}

function allowedWebsiteOrigins() {
  const configured = [
    CANONICAL_SITE_ORIGIN,
    'https://www.guardscope.app',
    BACKEND_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ]
    .map((origin) => origin?.trim())
    .filter(Boolean)

  return new Set(configured)
}

export function getAllowedOrigin(req: { headers: { get: (k: string) => string | null } }): string {
  const origin = req.headers.get('origin') ?? ''

  if (!origin) return CANONICAL_SITE_ORIGIN
  if (origin === 'https://mail.google.com') return origin
  if (allowedWebsiteOrigins().has(origin)) return origin

  if (origin.startsWith('chrome-extension://')) {
    if (!isProductionRuntime()) return origin
    return allowedExtensionOrigins().has(origin) ? origin : 'null'
  }

  return 'null'
}

export function buildCorsHeaders(
  req: { headers: { get: (k: string) => string | null } },
  methods = 'POST, OPTIONS'
): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

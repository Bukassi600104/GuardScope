import { hasHashSecret, securityHash } from './securityHash'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''

type DbRateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SERVICE_KEY && hasHashSecret())
}

function headers(extra?: Record<string, string>) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

function parseCount(value: string | null) {
  const count = value?.split('/')[1]
  return count && count !== '*' ? parseInt(count, 10) : 0
}

export async function checkDbRateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowMs: number
): Promise<DbRateLimitResult | null> {
  if (!hasSupabaseConfig()) return null

  const identifierHash = securityHash(`${scope}:${identifier}`)
  if (!identifierHash) return null

  const since = new Date(Date.now() - windowMs).toISOString()
  const countUrl =
    `${SUPABASE_URL}/rest/v1/api_rate_events?` +
    `scope=eq.${encodeURIComponent(scope)}` +
    `&identifier_hash=eq.${encodeURIComponent(identifierHash)}` +
    `&created_at=gte.${encodeURIComponent(since)}` +
    '&select=id'

  const countRes = await fetch(countUrl, {
    headers: headers({ Prefer: 'count=exact', Range: '0-0' }),
    cache: 'no-store',
  })
  if (!countRes.ok) return null

  const used = parseCount(countRes.headers.get('content-range'))
  const allowed = used < limit

  await fetch(`${SUPABASE_URL}/rest/v1/api_rate_events`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      scope,
      identifier_hash: identifierHash,
      allowed,
      reason: allowed ? 'allowed' : 'rate_limited',
    }),
  }).catch(() => {})

  return {
    allowed,
    remaining: Math.max(0, limit - used - (allowed ? 1 : 0)),
    resetAt: Date.now() + windowMs,
  }
}

export function productionLimiterUnavailableResult(): DbRateLimitResult {
  return { allowed: false, remaining: 0, resetAt: Date.now() + 60_000 }
}

export function isProductionRuntime() {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
}

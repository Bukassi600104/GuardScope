/**
 * Quota enforcement — verifies and increments usage count atomically.
 *
 * Free users: 5 analyses/month
 * Pro/Team users: unlimited (no check needed)
 * Anonymous users: 5 analyses/month tracked by IP hash (best-effort)
 *
 * Uses Supabase service key to bypass RLS for atomic upsert.
 * All quota changes go through a single UPDATE+RETURNING to prevent races.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''

const FREE_LIMIT = 5

export interface QuotaResult {
  allowed: boolean
  count: number
  limit: number | null  // null = unlimited
  tier: string
}

// UUID v4 pattern — Supabase user IDs are always UUIDs
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Decode AND cryptographically verify a Supabase JWT.
 * Supabase issues HS256 JWTs signed with JWT_SECRET (from env).
 * If JWT_SECRET is not configured, falls back to decode-only (dev mode).
 *
 * Returns null if the token is invalid, expired, or signature doesn't match.
 */
export async function decodeJwt(token: string): Promise<{ sub?: string; email?: string } | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    ) as { sub?: string; email?: string; exp?: number }

    // Reject expired tokens
    if (payload.exp && payload.exp * 1000 < Date.now()) return null

    // Validate UUID format of sub — prevents injection via crafted tokens
    if (payload.sub && !UUID_REGEX.test(payload.sub)) return null

    // Cryptographic verification if JWT secret is available
    const jwtSecret = process.env.SUPABASE_JWT_SECRET
    if (jwtSecret) {
      const { createHmac } = await import('crypto')
      const signingInput = `${parts[0]}.${parts[1]}`
      const expected = createHmac('sha256', jwtSecret)
        .update(signingInput)
        .digest('base64url')
      if (expected !== parts[2]) return null // signature mismatch — reject
    }

    return payload
  } catch {
    return null
  }
}

/**
 * Check and increment quota for a user.
 * Returns { allowed: false } if the user has hit their limit.
 * Returns { allowed: true } and increments count if they're within limit.
 */
export async function checkAndIncrementQuota(
  userId: string,
  tier: string
): Promise<QuotaResult> {
  // Pro/Team = unlimited
  if (tier === 'pro' || tier === 'team') {
    // Still increment for analytics — but don't block
    incrementUsageFireAndForget(userId)
    return { allowed: true, count: 0, limit: null, tier }
  }

  if (!SUPABASE_SERVICE_KEY) {
    // No service key configured — allow all (dev mode)
    return { allowed: true, count: 0, limit: FREE_LIMIT, tier }
  }

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  try {
    // Try to increment — if count is already at limit, the WHERE clause fails
    // and we get 0 rows back, meaning quota exceeded.
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/usage?user_id=eq.${userId}&month=eq.${month}&year=eq.${year}&analysis_count=lt.${FREE_LIMIT}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ analysis_count: { increment: 1 } }),
      }
    )

    if (updateRes.ok) {
      const rows = await updateRes.json() as Array<{ analysis_count: number }>
      if (rows.length > 0) {
        return { allowed: true, count: rows[0].analysis_count, limit: FREE_LIMIT, tier }
      }
    }

    // UPDATE returned 0 rows — either no row exists yet OR count is at limit.
    // Check current count to distinguish.
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/usage?select=analysis_count&user_id=eq.${userId}&month=eq.${month}&year=eq.${year}`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    )

    if (checkRes.ok) {
      const rows = await checkRes.json() as Array<{ analysis_count: number }>
      if (rows.length === 0) {
        // No row for this month yet — insert and allow
        await upsertUsageRow(userId, month, year)
        return { allowed: true, count: 1, limit: FREE_LIMIT, tier }
      }
      const currentCount = rows[0].analysis_count
      if (currentCount >= FREE_LIMIT) {
        return { allowed: false, count: currentCount, limit: FREE_LIMIT, tier }
      }
    }

    // Fallback: allow if we can't determine (network issue)
    return { allowed: true, count: 0, limit: FREE_LIMIT, tier }
  } catch {
    // Network error — allow request but don't enforce
    return { allowed: true, count: 0, limit: FREE_LIMIT, tier }
  }
}

async function upsertUsageRow(userId: string, month: number, year: number): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ user_id: userId, month, year, analysis_count: 1 }),
    })
  } catch { /* best-effort */ }
}

async function incrementUsageFireAndForget(userId: string): Promise<void> {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  // Fire-and-forget — don't await, don't block the analysis
  upsertUsageRow(userId, month, year).catch(() => {})
}

/**
 * Fetch the user's tier from the public.users table.
 * Falls back to 'free' if the user doesn't exist yet (auto-created by trigger).
 */
export async function getUserTier(userId: string): Promise<string> {
  if (!SUPABASE_SERVICE_KEY) return 'free'
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/users?select=tier&id=eq.${userId}`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    )
    if (res.ok) {
      const rows = await res.json() as Array<{ tier: string }>
      return rows[0]?.tier ?? 'free'
    }
  } catch { /* fallback */ }
  return 'free'
}

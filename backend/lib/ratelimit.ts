/**
 * Rate limiting via Upstash Redis.
 * - Authenticated users: 10 requests/minute + 50 requests/hour (abuse prevention)
 * - Anonymous (IP-based): 5 requests/minute
 *
 * Gracefully falls back to allow-all if Upstash credentials aren't configured.
 * This keeps the API functional in development and during initial deployment.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let redis: Redis | null = null
let authRatelimit: Ratelimit | null = null
let authHourlyRatelimit: Ratelimit | null = null
let anonRatelimit: Ratelimit | null = null
let anonDailyRatelimit: Ratelimit | null = null
let anonFreeQuota: Ratelimit | null = null

function getInstances() {
  if (authRatelimit) return { authRatelimit, authHourlyRatelimit: authHourlyRatelimit!, anonRatelimit: anonRatelimit!, anonDailyRatelimit: anonDailyRatelimit! }

  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_URL ?? ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_TOKEN ?? ''

  if (!url || !token) {
    return { authRatelimit: null, authHourlyRatelimit: null, anonRatelimit: null, anonDailyRatelimit: null }
  }

  redis = new Redis({ url, token })
  authRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: false,
    prefix: 'gs_auth',
  })
  // Abuse prevention: 50 analyses per hour per user (Phase 6-5)
  authHourlyRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 h'),
    analytics: false,
    prefix: 'gs_auth_hourly',
  })
  anonRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: false,
    prefix: 'gs_anon',
  })
  // Abuse cap: 30 analyses per day per IP — prevents cost abuse beyond the free quota
  anonDailyRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 d'),
    analytics: false,
    prefix: 'gs_anon_daily',
  })
  // Free plan quota: 5 analyses per day per IP (business rule, not abuse protection)
  // Fixed window resets cleanly on a 24-hour boundary from first request.
  anonFreeQuota = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(5, '1 d'),
    analytics: false,
    prefix: 'gs_anon_free',
  })

  return { authRatelimit, authHourlyRatelimit, anonRatelimit, anonDailyRatelimit }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number  // unix ms
}

/**
 * Check and increment the free daily quota for anonymous (unauthenticated) users.
 * 5 analyses per day per IP. Uses fixed window — resets 24 hours after the first request.
 * Falls back to allow-all if Redis is unavailable (infra fault ≠ user fault).
 */
export async function checkAnonFreeQuota(
  ip: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  try {
    getInstances() // ensure all limiters are initialised
    if (!anonFreeQuota) return { allowed: true, count: 0, limit: 5 }
    const result = await anonFreeQuota.limit(ip)
    // remaining can go negative if burst exceeded — clamp to 0 before computing used count
    const count = result.limit - Math.max(0, result.remaining)
    return { allowed: result.success, count, limit: result.limit }
  } catch {
    return { allowed: true, count: 0, limit: 5 } // fail open
  }
}

export async function checkRateLimit(
  identifier: string,
  isAuthenticated: boolean
): Promise<RateLimitResult> {
  try {
    const { authRatelimit: auth, authHourlyRatelimit: authHourly, anonRatelimit: anon } = getInstances()

    if (isAuthenticated) {
      if (!auth) return { allowed: true, remaining: 99, resetAt: 0 }
      // Check per-minute limit first
      const minuteResult = await auth.limit(identifier)
      if (!minuteResult.success) {
        return { allowed: false, remaining: minuteResult.remaining, resetAt: minuteResult.reset }
      }
      // Check hourly abuse limit
      if (authHourly) {
        const hourlyResult = await authHourly.limit(identifier)
        if (!hourlyResult.success) {
          return { allowed: false, remaining: 0, resetAt: hourlyResult.reset }
        }
      }
      return { allowed: true, remaining: minuteResult.remaining, resetAt: minuteResult.reset }
    }

    const limiter = anon
    if (!limiter) return { allowed: true, remaining: 99, resetAt: 0 }
    // Check per-minute limit first
    const result = await limiter.limit(identifier)
    if (!result.success) {
      return { allowed: false, remaining: result.remaining, resetAt: result.reset }
    }
    // Check daily cap to prevent cost abuse
    if (anonDailyRatelimit) {
      const dailyResult = await anonDailyRatelimit.limit(identifier)
      if (!dailyResult.success) {
        return { allowed: false, remaining: 0, resetAt: dailyResult.reset }
      }
    }
    return { allowed: true, remaining: result.remaining, resetAt: result.reset }
  } catch {
    // Redis unreachable — allow request (fail open)
    return { allowed: true, remaining: 99, resetAt: 0 }
  }
}

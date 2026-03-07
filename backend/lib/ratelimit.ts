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

function getInstances() {
  if (authRatelimit) return { authRatelimit, authHourlyRatelimit: authHourlyRatelimit!, anonRatelimit: anonRatelimit! }

  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_URL ?? ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_TOKEN ?? ''

  if (!url || !token) {
    return { authRatelimit: null, authHourlyRatelimit: null, anonRatelimit: null }
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

  return { authRatelimit, authHourlyRatelimit, anonRatelimit }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number  // unix ms
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
    const result = await limiter.limit(identifier)
    return { allowed: result.success, remaining: result.remaining, resetAt: result.reset }
  } catch {
    // Redis unreachable — allow request (fail open)
    return { allowed: true, remaining: 99, resetAt: 0 }
  }
}

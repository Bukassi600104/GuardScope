/**
 * Rate limiting via Upstash Redis.
 * - Authenticated users: 10 requests/minute (sliding window)
 * - Anonymous (IP-based): 5 requests/minute
 *
 * Gracefully falls back to allow-all if Upstash credentials aren't configured.
 * This keeps the API functional in development and during initial deployment.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let redis: Redis | null = null
let authRatelimit: Ratelimit | null = null
let anonRatelimit: Ratelimit | null = null

function getInstances() {
  if (authRatelimit) return { authRatelimit, anonRatelimit: anonRatelimit! }

  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_URL ?? ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_TOKEN ?? ''

  if (!url || !token) {
    return { authRatelimit: null, anonRatelimit: null }
  }

  redis = new Redis({ url, token })
  authRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: false,
    prefix: 'gs_auth',
  })
  anonRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: false,
    prefix: 'gs_anon',
  })

  return { authRatelimit, anonRatelimit }
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
    const { authRatelimit: auth, anonRatelimit: anon } = getInstances()
    const limiter = isAuthenticated ? auth : anon
    if (!limiter) return { allowed: true, remaining: 99, resetAt: 0 }

    const result = await limiter.limit(identifier)
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    }
  } catch {
    // Redis unreachable — allow request (fail open)
    return { allowed: true, remaining: 99, resetAt: 0 }
  }
}

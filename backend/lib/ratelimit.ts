/**
 * Shared rate limiting.
 *
 * Primary limiter: Upstash Redis when configured.
 * Fallback limiter: Supabase-backed hashed event counters.
 *
 * Production must not silently fail open. If neither limiter is available in
 * production, protected requests are denied instead of allowing unlimited use.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { checkDbRateLimit, isProductionRuntime, productionLimiterUnavailableResult } from './dbRateLimit'

let redis: Redis | null = null
let authRatelimit: Ratelimit | null = null
let authHourlyRatelimit: Ratelimit | null = null
let anonRatelimit: Ratelimit | null = null
let anonDailyRatelimit: Ratelimit | null = null
let anonFreeQuota: Ratelimit | null = null

function getInstances() {
  if (authRatelimit) {
    return {
      authRatelimit,
      authHourlyRatelimit: authHourlyRatelimit!,
      anonRatelimit: anonRatelimit!,
      anonDailyRatelimit: anonDailyRatelimit!,
    }
  }

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
  anonDailyRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 d'),
    analytics: false,
    prefix: 'gs_anon_daily',
  })
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
  resetAt: number
}

export async function checkAnonFreeQuota(
  ip: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  try {
    getInstances()
    if (!anonFreeQuota) {
      const dbResult = await checkDbRateLimit('anon_free_daily', ip, 5, 24 * 60 * 60 * 1000)
      if (dbResult) return { allowed: dbResult.allowed, count: 5 - dbResult.remaining, limit: 5 }
      if (isProductionRuntime()) return { allowed: false, count: 5, limit: 5 }
      return { allowed: true, count: 0, limit: 5 }
    }

    const result = await anonFreeQuota.limit(ip)
    const count = result.limit - Math.max(0, result.remaining)
    return { allowed: result.success, count, limit: result.limit }
  } catch {
    if (isProductionRuntime()) return { allowed: false, count: 5, limit: 5 }
    return { allowed: true, count: 0, limit: 5 }
  }
}

export async function checkRateLimit(
  identifier: string,
  isAuthenticated: boolean
): Promise<RateLimitResult> {
  try {
    const { authRatelimit: auth, authHourlyRatelimit: authHourly, anonRatelimit: anon } = getInstances()

    if (isAuthenticated) {
      if (!auth) {
        const minute = await checkDbRateLimit('auth_minute', identifier, 10, 60 * 1000)
        if (minute && !minute.allowed) return minute

        const hourly = await checkDbRateLimit('auth_hourly', identifier, 50, 60 * 60 * 1000)
        if (hourly) return hourly.allowed ? (minute ?? hourly) : hourly

        return isProductionRuntime()
          ? productionLimiterUnavailableResult()
          : { allowed: true, remaining: 99, resetAt: 0 }
      }

      const minuteResult = await auth.limit(identifier)
      if (!minuteResult.success) {
        return { allowed: false, remaining: minuteResult.remaining, resetAt: minuteResult.reset }
      }

      if (authHourly) {
        const hourlyResult = await authHourly.limit(identifier)
        if (!hourlyResult.success) {
          return { allowed: false, remaining: 0, resetAt: hourlyResult.reset }
        }
      }

      return { allowed: true, remaining: minuteResult.remaining, resetAt: minuteResult.reset }
    }

    if (!anon) {
      const minute = await checkDbRateLimit('anon_minute', identifier, 5, 60 * 1000)
      if (minute && !minute.allowed) return minute

      const daily = await checkDbRateLimit('anon_daily', identifier, 30, 24 * 60 * 60 * 1000)
      if (daily) return daily.allowed ? (minute ?? daily) : daily

      return isProductionRuntime()
        ? productionLimiterUnavailableResult()
        : { allowed: true, remaining: 99, resetAt: 0 }
    }

    const result = await anon.limit(identifier)
    if (!result.success) {
      return { allowed: false, remaining: result.remaining, resetAt: result.reset }
    }

    if (anonDailyRatelimit) {
      const dailyResult = await anonDailyRatelimit.limit(identifier)
      if (!dailyResult.success) {
        return { allowed: false, remaining: 0, resetAt: dailyResult.reset }
      }
    }

    return { allowed: true, remaining: result.remaining, resetAt: result.reset }
  } catch {
    return isProductionRuntime()
      ? productionLimiterUnavailableResult()
      : { allowed: true, remaining: 99, resetAt: 0 }
  }
}

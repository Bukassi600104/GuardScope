/**
 * Analysis result cache — Upstash Redis, 24-hour TTL.
 * Keyed on SHA-256(fromEmail + subject + bodyText[:1000]).
 * Ensures the same email always returns the same score within a 24-hour window,
 * eliminating AI non-determinism variance between repeated scans.
 */

import { Redis } from '@upstash/redis'

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_URL ?? ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_TOKEN ?? ''
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

const TTL_SECONDS = 86_400 // 24 hours

export async function getCachedResult(key: string): Promise<unknown | null> {
  const r = getRedis()
  if (!r) return null
  try {
    return await r.get(key)
  } catch {
    return null // Redis unavailable — proceed without cache
  }
}

export async function setCachedResult(key: string, value: unknown): Promise<void> {
  const r = getRedis()
  if (!r) return
  try {
    await r.set(key, value, { ex: TTL_SECONDS })
  } catch { /* non-fatal — cache miss on next request */ }
}

/**
 * In-memory LRU URL result cache.
 * Deduplicates VT/SB/PhishTank calls for URLs seen multiple times across requests.
 * TTL: 15 minutes. Max: 100 entries. Evicts oldest on overflow.
 *
 * Note: This is a process-level cache. Vercel functions may not share memory
 * across instances, but within a warm instance this prevents redundant API calls.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private readonly maxSize: number
  private readonly ttlMs: number

  constructor(maxSize = 100, ttlMs = 15 * 60 * 1000) {
    this.maxSize = maxSize
    this.ttlMs = ttlMs
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }
    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry.value
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      // Evict oldest entry (first in Map iteration order)
      const oldest = this.cache.keys().next().value
      if (oldest) this.cache.delete(oldest)
    }
    this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }
}

// Shared cache instances (process-level)
export const urlScanCache = new LRUCache<{ vt_flagged: boolean; sb_flagged: boolean; pt_flagged: boolean; uh_flagged: boolean }>(100)

/**
 * Normalize a URL for consistent cache key generation.
 * - Lowercase scheme + host
 * - Remove tracking parameters (utm_*, fbclid, gclid, ref, etc.)
 * - Remove fragment (#...)
 * - Sort remaining query params for canonical form
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl)

    // Lowercase scheme and host
    url.protocol = url.protocol.toLowerCase()
    url.hostname = url.hostname.toLowerCase()

    // Remove tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', 'dclid', 'twclid',
      'ref', 'referrer', 'source', 'mc_cid', 'mc_eid',
      '_ga', '_gl', 'igshid', 'yclid',
    ]
    trackingParams.forEach(p => url.searchParams.delete(p))

    // Remove fragment
    url.hash = ''

    // Sort remaining query params for canonical form
    const params = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b))
    url.search = new URLSearchParams(params).toString()

    return url.toString()
  } catch {
    return rawUrl.toLowerCase().trim()
  }
}

/**
 * Normalize an array of URLs and deduplicate.
 */
export function normalizeUrls(urls: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const url of urls) {
    const normalized = normalizeUrl(url)
    if (!seen.has(normalized)) {
      seen.add(normalized)
      result.push(normalized)
    }
  }
  return result
}

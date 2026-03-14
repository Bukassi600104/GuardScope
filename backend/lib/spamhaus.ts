/**
 * Spamhaus Domain Block List (DBL) check — free, DNS-based, no API key required.
 *
 * Spamhaus DBL is the gold standard domain reputation list used by all major
 * email security vendors (Proofpoint, Mimecast, Microsoft Defender for Office 365).
 *
 * Query: {domain}.dbl.spamhaus.org → DNS A record lookup
 * Response codes:
 *   127.0.1.2 = spam domain
 *   127.0.1.4 = phishing domain ← HIGH confidence
 *   127.0.1.5 = malware domain ← CRITICAL
 *   127.0.1.6 = botnet C&C domain
 *   NXDOMAIN  = not listed (clean)
 *
 * Free tier: unlimited DNS queries, no registration.
 * Latency: ~50-100ms (DNS query, same path as existing DNS checks).
 */

import type { SpamhausResult } from './types'

const DBL_SUFFIX = 'dbl.spamhaus.org'
const DOH_URL = 'https://cloudflare-dns.com/dns-query'

async function dnsALookup(fqdn: string): Promise<string[]> {
  const url = `${DOH_URL}?name=${encodeURIComponent(fqdn)}&type=A`
  const res = await fetch(url, {
    headers: { Accept: 'application/dns-json' },
    signal: AbortSignal.timeout(4000),
  })
  if (!res.ok) return []
  const data = await res.json() as { Answer?: Array<{ type: number; data: string }> }
  return (data.Answer ?? [])
    .filter(r => r.type === 1)  // A records only
    .map(r => r.data.trim())
}

/**
 * Check sender domain against Spamhaus DBL.
 * Returns fast (DNS cache hit) for well-known clean domains.
 */
export async function spamhausCheck(domain: string): Promise<SpamhausResult> {
  if (!domain) return { checked: false, dblPhishing: false, dblMalware: false, dblSpam: false, sblListed: false }

  try {
    const fqdn = `${domain.toLowerCase()}.${DBL_SUFFIX}`
    const addresses = await dnsALookup(fqdn)

    if (addresses.length === 0) {
      // NXDOMAIN = not listed = clean
      return { checked: true, dblPhishing: false, dblMalware: false, dblSpam: false, sblListed: false }
    }

    const dblPhishing = addresses.some(a => a === '127.0.1.4')
    const dblMalware  = addresses.some(a => a === '127.0.1.5' || a === '127.0.1.6')
    const dblSpam     = addresses.some(a => a === '127.0.1.2' || a === '127.0.1.3')
    const sblListed   = addresses.some(a => a.startsWith('127.0.1.'))

    return { checked: true, dblPhishing, dblMalware, dblSpam, sblListed }
  } catch (err) {
    return {
      checked: false,
      dblPhishing: false,
      dblMalware: false,
      dblSpam: false,
      sblListed: false,
      error: err instanceof Error ? err.message : 'DNS lookup failed',
    }
  }
}

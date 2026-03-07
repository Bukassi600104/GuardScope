/**
 * PhishTank URL lookup — free phishing database, no API key required for basic checks.
 * Uses the JSON API to check if a URL is a known phishing site.
 * Rate limit: ~5 req/min on free tier (no key). We only call for URLs not in other intel.
 */

const PHISHTANK_API = 'https://checkurl.phishtank.com/checkurl/'
const TIMEOUT_MS = 5000

export interface PhishTankResult {
  flagged: boolean
  phishingUrls: string[]
  error?: string
}

async function checkUrl(url: string): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    // PhishTank expects POST with url (base64) + format=json
    const body = new URLSearchParams({
      url: btoa(url),
      format: 'json',
      app_key: process.env.PHISHTANK_API_KEY ?? '', // optional — works without key but rate-limited
    })
    const res = await fetch(PHISHTANK_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'guardscope-security/1.0' },
      body: body.toString(),
      signal: controller.signal,
    })
    if (!res.ok) return false
    const data = await res.json() as { results?: { in_database: boolean; valid: boolean } }
    return data.results?.in_database === true && data.results?.valid === true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export async function phishTankScan(urls: string[]): Promise<PhishTankResult> {
  if (!urls.length) return { flagged: false, phishingUrls: [] }

  try {
    // Check up to 5 URLs (rate limit protection — PhishTank is slow)
    const batch = urls.slice(0, 5)
    const results = await Promise.allSettled(batch.map(checkUrl))
    const phishingUrls: string[] = []

    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) phishingUrls.push(batch[i])
    })

    return { flagged: phishingUrls.length > 0, phishingUrls }
  } catch (err) {
    return { flagged: false, phishingUrls: [], error: String(err) }
  }
}

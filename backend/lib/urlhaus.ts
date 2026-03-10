/**
 * URLhaus (abuse.ch) — free malware URL database.
 * Checks URLs and domains against known malware distribution sites.
 * No API key required. Rate limit: generous (not publicly documented).
 */

const URLHAUS_API = 'https://urlhaus-api.abuse.ch/v1'
const TIMEOUT_MS = 5000

export interface URLhausResult {
  flagged: boolean
  malwareUrls: string[]
  error?: string
}

async function checkUrl(url: string): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${URLHAUS_API}/url/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ url }).toString(),
      signal: controller.signal,
    })
    if (!res.ok) return false
    const data = await res.json() as { query_status: string; url_status?: string }
    // ONLY flag on explicit "is_malware" confirmation.
    // url_status "online"/"offline" just means the URL is accessible — NOT a threat indicator.
    // Treating "online" as malicious causes false positives on any accessible URL.
    return data.query_status === 'is_malware'
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

async function checkHost(domain: string): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${URLHAUS_API}/host/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ host: domain }).toString(),
      signal: controller.signal,
    })
    if (!res.ok) return false
    const data = await res.json() as { query_status: string; urls_count?: number }
    return data.query_status === 'is_host' && (data.urls_count ?? 0) > 0
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export async function urlHausScan(urls: string[], senderDomain?: string): Promise<URLhausResult> {
  if (!urls.length && !senderDomain) return { flagged: false, malwareUrls: [] }

  try {
    const checks: Promise<boolean>[] = []
    const labels: string[] = []

    // Check up to 5 URLs
    const batch = urls.slice(0, 5)
    batch.forEach(url => {
      checks.push(checkUrl(url))
      labels.push(url)
    })

    // Also check the sender domain as a host
    if (senderDomain) {
      checks.push(checkHost(senderDomain))
      labels.push(`host:${senderDomain}`)
    }

    const results = await Promise.allSettled(checks)
    const malwareUrls: string[] = []

    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) malwareUrls.push(labels[i])
    })

    return { flagged: malwareUrls.length > 0, malwareUrls }
  } catch (err) {
    return { flagged: false, malwareUrls: [], error: String(err) }
  }
}

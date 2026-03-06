import type { VirusTotalResult } from './types'

const VT_BASE = 'https://www.virustotal.com/api/v3'
const MAX_URLS = 10
const DELAY_MS = 250
const TIMEOUT_MS = 15000

function urlToId(url: string): string {
  // VT URL ID is base64url(url) without padding
  return Buffer.from(url).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function getUrlReport(url: string, apiKey: string): Promise<{ url: string; malicious: number; suspicious: number; engines: string[] } | null> {
  const id = urlToId(url)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${VT_BASE}/urls/${id}`, {
      headers: { 'x-apikey': apiKey },
      signal: controller.signal,
    })

    if (res.status === 404) {
      // URL not in VT cache — submit it (fire and forget) and return null
      fetch(`${VT_BASE}/urls`, {
        method: 'POST',
        headers: { 'x-apikey': apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `url=${encodeURIComponent(url)}`,
      }).catch(() => {})
      return null
    }

    if (!res.ok) return null

    const data = await res.json() as {
      data?: {
        attributes?: {
          last_analysis_stats?: { malicious: number; suspicious: number }
          last_analysis_results?: Record<string, { category: string; engine_name: string }>
        }
      }
    }

    const stats = data.data?.attributes?.last_analysis_stats
    if (!stats) return null

    const results = data.data?.attributes?.last_analysis_results ?? {}
    const flaggedEngines = Object.values(results)
      .filter((r) => r.category === 'malicious' || r.category === 'suspicious')
      .map((r) => r.engine_name)

    return {
      url,
      malicious: stats.malicious,
      suspicious: stats.suspicious,
      engines: flaggedEngines,
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function virusTotalScan(urls: string[]): Promise<VirusTotalResult> {
  if (urls.length === 0) return { flagged: false, results: [] }

  const apiKey = process.env.VIRUSTOTAL_API_KEY
  if (!apiKey) return { flagged: false, results: [], error: 'VIRUSTOTAL_API_KEY not configured' }

  const batch = urls.slice(0, MAX_URLS)
  const results: Array<{ url: string; malicious: number; suspicious: number; engines: string[] }> = []

  for (let i = 0; i < batch.length; i++) {
    if (i > 0) await sleep(DELAY_MS)
    const report = await getUrlReport(batch[i], apiKey)
    if (report) results.push(report)
  }

  const flagged = results.some((r) => r.malicious > 0)
  return { flagged, results }
}

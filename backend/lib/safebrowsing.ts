import type { SafeBrowsingResult } from './types'

const ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find'
const THREAT_TYPES = ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION']
const TIMEOUT_MS = 8000

export async function safeBrowsingCheck(urls: string[]): Promise<SafeBrowsingResult> {
  if (urls.length === 0) return { flagged: false, threats: [] }

  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY
  if (!apiKey) return { flagged: false, threats: [], error: 'GOOGLE_SAFE_BROWSING_API_KEY not configured' }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'guardscope', clientVersion: '1.0.0' },
        threatInfo: {
          threatTypes: THREAT_TYPES,
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: urls.map((url) => ({ url })),
        },
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      return { flagged: false, threats: [], error: `HTTP ${res.status}` }
    }

    const data = await res.json() as {
      matches?: Array<{ threat: { url: string }; threatType: string }>
    }

    const matches = data.matches ?? []
    const threats = matches.map((m) => ({ url: m.threat.url, threatType: m.threatType }))

    return { flagged: threats.length > 0, threats }
  } catch (err) {
    return { flagged: false, threats: [], error: String(err) }
  } finally {
    clearTimeout(timer)
  }
}

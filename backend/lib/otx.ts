/**
 * AlienVault OTX (Open Threat Exchange) — Domain & URL Threat Intelligence
 *
 * OTX is explicitly free for commercial and security research use.
 * Free account at otx.alienvault.com → API key → unlimited community intel.
 *
 * What it provides:
 *   - Domain reputation: pulse_count (community threat reports), malicious verdicts
 *   - URL reputation: specific page-level threat reports
 *   - Tags: categorized threat types (phishing, malware, etc.)
 *
 * Free tier: unlimited with free API key. Commercial use explicitly permitted.
 * Latency: ~200-400ms per call. Run in parallel with other intel sources.
 *
 * License note: OTX data is covered by their Terms of Use which allows use in
 * commercial security products. Sign up at otx.alienvault.com/api for free key.
 */

export interface OTXResult {
  checked: boolean
  malicious: boolean         // community reported as malicious
  pulseCount: number         // number of threat intel reports mentioning this domain
  tags: string[]             // threat categories (e.g., ['phishing', 'malware'])
  error?: string
}

const OTX_BASE = 'https://otx.alienvault.com/api/v1'

async function otxDomainCheck(domain: string, apiKey: string): Promise<OTXResult> {
  const res = await fetch(`${OTX_BASE}/indicators/domain/${encodeURIComponent(domain)}/general`, {
    headers: { 'X-OTX-API-KEY': apiKey },
    signal: AbortSignal.timeout(4000),
  })

  if (res.status === 404) {
    return { checked: true, malicious: false, pulseCount: 0, tags: [] }
  }
  if (!res.ok) {
    throw new Error(`OTX HTTP ${res.status}`)
  }

  const data = await res.json() as {
    pulse_info?: { count?: number; pulses?: Array<{ tags?: string[] }>; references?: string[] }
    validation?: Array<{ source?: string; message?: string; name?: string }>
    sections?: string[]
  }

  const pulseCount = data.pulse_info?.count ?? 0
  const tags = [...new Set(
    (data.pulse_info?.pulses ?? []).flatMap(p => p.tags ?? []).map(t => t.toLowerCase())
  )].slice(0, 10)

  // A domain is considered malicious if it has community reports AND any malicious tags
  const maliciousTags = ['phishing', 'malware', 'ransomware', 'botnet', 'c2', 'c&c', 'spam']
  const malicious = pulseCount > 0 && tags.some(t => maliciousTags.some(m => t.includes(m)))

  return { checked: true, malicious, pulseCount, tags }
}

/**
 * Check sender domain against AlienVault OTX community threat intelligence.
 * Requires OTX_API_KEY environment variable (free at otx.alienvault.com).
 * Fails open if key not configured.
 */
export async function otxCheck(domain: string): Promise<OTXResult> {
  const apiKey = process.env.OTX_API_KEY
  if (!apiKey || !domain) {
    return { checked: false, malicious: false, pulseCount: 0, tags: [] }
  }

  try {
    return await otxDomainCheck(domain, apiKey)
  } catch (err) {
    return {
      checked: false,
      malicious: false,
      pulseCount: 0,
      tags: [],
      error: err instanceof Error ? err.message : 'OTX unavailable',
    }
  }
}

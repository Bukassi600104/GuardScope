import type { DnsResult } from './types'

const DOH_BASE = 'https://cloudflare-dns.com/dns-query'
const TIMEOUT_MS = 5000

// Common DKIM selectors used by major email providers and platforms.
// We try these when the sender's selector is unknown (we lack email headers).
const COMMON_DKIM_SELECTORS = [
  'google', 'mail', 'dkim', 'default', 'selector1', 'selector2',
  'k1', 'k2', 'smtp', 'email', 'mandrill', 'mailchimp', 'sendgrid',
  'pm', 'mx', 's1', 's2', 'key1', 'key2',
]

async function fetchTxt(name: string): Promise<string[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${DOH_BASE}?name=${encodeURIComponent(name)}&type=TXT`, {
      headers: { Accept: 'application/dns-json' },
      signal: controller.signal,
    })
    if (!res.ok) return []
    const data = await res.json() as { Answer?: Array<{ data: string }> }
    return (data.Answer ?? []).map((r) => r.data.replace(/"/g, ''))
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}

function parseSpf(records: string[]): DnsResult['spf'] {
  const spf = records.find((r) => r.startsWith('v=spf1'))
  if (!spf) return 'none'
  // +all = any server may send mail as this domain — maximum phishing risk
  if (spf.includes('+all')) return 'fail'
  // ~all = soft fail, ?all = neutral
  if (spf.includes('~all') || spf.includes('?all')) return 'neutral'
  // -all = strict reject — properly configured SPF
  if (spf.includes('-all')) return 'pass'
  return 'pass'
}

function parseDmarc(records: string[]): DnsResult['dmarc'] {
  const raw = records.find((r) => r.startsWith('v=DMARC1'))
  if (!raw) return { policy: 'none', raw: '' }
  const match = raw.match(/p=(none|quarantine|reject)/i)
  if (!match) return { policy: 'none', raw }
  const policy = match[1].toLowerCase() as 'none' | 'quarantine' | 'reject'
  return { policy, raw }
}

async function checkDkim(domain: string): Promise<'present' | 'unknown'> {
  // Try common selectors in parallel — DKIM records live at {selector}._domainkey.{domain}.
  // Without email headers we cannot know the exact selector, so we probe common ones.
  // If none match we return 'unknown' (NOT 'absent') — absence of evidence ≠ evidence of absence.
  const probes = COMMON_DKIM_SELECTORS.map((s) => fetchTxt(`${s}._domainkey.${domain}`))
  const results = await Promise.allSettled(probes)
  const found = results.some(
    (r) => r.status === 'fulfilled' && r.value.some((txt) => txt.includes('v=DKIM1'))
  )
  return found ? 'present' : 'unknown'
}

export async function dnsLookup(domain: string): Promise<DnsResult> {
  try {
    const [spfRecords, dkimResult, dmarcRecords] = await Promise.allSettled([
      fetchTxt(domain),
      checkDkim(domain),
      fetchTxt(`_dmarc.${domain}`),
    ])

    const spfTxt = spfRecords.status === 'fulfilled' ? spfRecords.value : []
    const dkim = dkimResult.status === 'fulfilled' ? dkimResult.value : 'unknown'
    const dmarcTxt = dmarcRecords.status === 'fulfilled' ? dmarcRecords.value : []

    return {
      spf: parseSpf(spfTxt),
      dkim,
      dmarc: parseDmarc(dmarcTxt),
    }
  } catch (err) {
    return {
      spf: 'error',
      dkim: 'unknown',
      dmarc: { policy: 'error', raw: '' },
      error: String(err),
    }
  }
}

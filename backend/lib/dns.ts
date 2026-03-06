import type { DnsResult } from './types'

const DOH_BASE = 'https://cloudflare-dns.com/dns-query'
const TIMEOUT_MS = 5000

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
  if (spf.includes('+all') || spf.includes('~all')) return 'neutral'
  if (spf.includes('-all')) return 'pass'
  if (spf.includes('?all')) return 'neutral'
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

export async function dnsLookup(domain: string): Promise<DnsResult> {
  try {
    const [spfRecords, dkimRecords, dmarcRecords] = await Promise.allSettled([
      fetchTxt(domain),
      fetchTxt(`_domainkey.${domain}`),
      fetchTxt(`_dmarc.${domain}`),
    ])

    const spfTxt = spfRecords.status === 'fulfilled' ? spfRecords.value : []
    const dkimTxt = dkimRecords.status === 'fulfilled' ? dkimRecords.value : []
    const dmarcTxt = dmarcRecords.status === 'fulfilled' ? dmarcRecords.value : []

    return {
      spf: parseSpf(spfTxt),
      dkim: dkimTxt.length > 0 ? 'present' : 'absent',
      dmarc: parseDmarc(dmarcTxt),
    }
  } catch (err) {
    return {
      spf: 'error',
      dkim: 'error',
      dmarc: { policy: 'error', raw: '' },
      error: String(err),
    }
  }
}

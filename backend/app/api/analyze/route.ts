import { NextRequest, NextResponse } from 'next/server'
import type { EmailInput, AnalysisReport, HaikuResult, DnsResult, VirusTotalResult, SafeBrowsingResult, RdapResult } from '../../../lib/types'
import { haikuPrescan, sonnetDeepAnalysis } from '../../../lib/claude'
import { mercuryPrescan, mercuryDeepAnalysis } from '../../../lib/inception'
import { dnsLookup } from '../../../lib/dns'
import { virusTotalScan } from '../../../lib/virustotal'
import { safeBrowsingCheck } from '../../../lib/safebrowsing'
import { rdapLookup } from '../../../lib/rdap'

type Provider = 'claude' | 'mercury'

const MAX_BODY_BYTES = 500_000

function scoreToLevel(score: number): AnalysisReport['risk_level'] {
  if (score <= 25) return 'SAFE'
  if (score <= 49) return 'LOW'
  if (score <= 69) return 'MEDIUM'
  if (score <= 84) return 'HIGH'
  return 'CRITICAL'
}

function buildFastReport(
  haiku: HaikuResult,
  dns: DnsResult,
  vt: VirusTotalResult,
  sb: SafeBrowsingResult,
  rdap: RdapResult
): Omit<AnalysisReport, 'duration_ms'> {
  const score = Math.min(100, Math.max(0, haiku.pre_score))
  const risk_level = scoreToLevel(score)

  const green_flags: AnalysisReport['green_flags'] = []
  const red_flags: AnalysisReport['red_flags'] = []

  // Sender authentication flags
  if (dns.spf === 'pass') {
    green_flags.push({ label: 'SPF Pass', detail: 'Sender is authorized by the domain SPF record', module: 'sender_auth' })
  } else if (dns.spf === 'fail') {
    red_flags.push({ label: 'SPF Fail', evidence: 'Sender is not authorized by domain SPF record', severity: 'HIGH', module: 'sender_auth' })
  } else if (dns.spf === 'none') {
    red_flags.push({ label: 'No SPF Record', evidence: 'Domain has no SPF record — spoofing possible', severity: 'MEDIUM', module: 'sender_auth' })
  }

  if (dns.dkim === 'present') {
    green_flags.push({ label: 'DKIM Configured', detail: 'Domain has DKIM signing configured', module: 'sender_auth' })
  } else if (dns.dkim === 'absent') {
    red_flags.push({ label: 'No DKIM', evidence: 'Domain does not have DKIM signing configured', severity: 'MEDIUM', module: 'sender_auth' })
  }

  if (dns.dmarc.policy === 'reject') {
    green_flags.push({ label: 'DMARC Reject', detail: 'Strong DMARC policy — unauthorized emails are rejected', module: 'sender_auth' })
  } else if (dns.dmarc.policy === 'quarantine') {
    green_flags.push({ label: 'DMARC Quarantine', detail: 'DMARC policy quarantines unauthorized emails', module: 'sender_auth' })
  } else if (dns.dmarc.policy === 'none') {
    red_flags.push({ label: 'Weak DMARC Policy', evidence: 'DMARC is monitoring only — no enforcement', severity: 'LOW', module: 'sender_auth' })
  }

  // Domain intelligence
  if (rdap.riskLevel === 'HIGH') {
    red_flags.push({
      label: 'Newly Registered Domain',
      evidence: `Domain registered only ${rdap.ageInDays} days ago — strong phishing indicator`,
      severity: 'HIGH',
      module: 'domain_intel',
    })
  } else if (rdap.riskLevel === 'MEDIUM') {
    red_flags.push({
      label: 'Recently Registered Domain',
      evidence: `Domain registered ${rdap.ageInDays} days ago`,
      severity: 'MEDIUM',
      module: 'domain_intel',
    })
  } else if (rdap.riskLevel === 'LOW' && rdap.ageInDays !== null) {
    green_flags.push({
      label: 'Established Domain',
      detail: `Domain has been active for ${rdap.ageInDays} days`,
      module: 'domain_intel',
    })
  }

  // URL threat intelligence
  if (vt.flagged) {
    const flaggedUrls = vt.results.filter((r) => r.malicious > 0).map((r) => r.url)
    red_flags.push({
      label: 'Malicious URLs Detected',
      evidence: `VirusTotal flagged: ${flaggedUrls.join(', ')}`,
      severity: 'CRITICAL',
      module: 'url_analysis',
    })
  }

  if (sb.flagged) {
    const types = [...new Set(sb.threats.map((t) => t.threatType))]
    red_flags.push({
      label: 'Google Safe Browsing Alert',
      evidence: `Threat types detected: ${types.join(', ')}`,
      severity: 'CRITICAL',
      module: 'url_analysis',
    })
  }

  if (!vt.flagged && !sb.flagged && (vt.results.length > 0 || sb.threats.length === 0)) {
    green_flags.push({ label: 'URLs Clean', detail: 'No malicious URLs detected by threat intelligence', module: 'url_analysis' })
  }

  // Haiku content signals
  for (const signal of haiku.signals) {
    red_flags.push({ label: 'Suspicious Content Signal', evidence: signal, severity: 'MEDIUM', module: 'content_analysis' })
  }

  const verdict =
    risk_level === 'SAFE'
      ? 'Email pre-screening found no significant threat indicators'
      : `Email shows ${red_flags.length} suspicious indicator(s) — manual review recommended`

  const recommendation =
    risk_level === 'SAFE'
      ? 'No action required'
      : 'Do not click links or open attachments until verified with the sender'

  return {
    risk_score: score,
    risk_level,
    verdict,
    recommendation,
    green_flags,
    red_flags,
    modules: {
      sender_auth: { spf: dns.spf, dkim: dns.dkim, dmarc: dns.dmarc.policy },
      domain_intel: { age_days: rdap.ageInDays, risk_level: rdap.riskLevel, registrar: rdap.registrar },
      content_analysis: { pre_score: haiku.pre_score, signals: haiku.signals },
      url_analysis: { vt_flagged: vt.flagged, sb_flagged: sb.flagged, flagged_count: red_flags.filter((f) => f.module === 'url_analysis').length },
      behavioral: {},
    },
    analysis_path: 'haiku_fast',
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now()

  // 1. Size guard
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body too large (max 500KB)' }, { status: 413 })
  }

  // 2. Parse + validate body
  let body: Partial<EmailInput> & { provider?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.fromEmail || !body.subject || !body.bodyText) {
    return NextResponse.json({ error: 'Missing required fields: fromEmail, subject, bodyText' }, { status: 400 })
  }

  // Determine AI provider: 'claude' (default) or 'mercury' (InceptionLabs)
  const provider: Provider = body.provider === 'mercury' ? 'mercury' : 'claude'

  const email: EmailInput = {
    fromName: body.fromName ?? null,
    fromEmail: body.fromEmail,
    subject: body.subject,
    date: body.date ?? null,
    bodyText: body.bodyText,
    urls: Array.isArray(body.urls) ? body.urls : [],
    attachments: Array.isArray(body.attachments) ? body.attachments : [],
    replyTo: body.replyTo ?? null,
    messageId: body.messageId ?? null,
  }

  // 3. Extract sender domain
  const domainMatch = email.fromEmail?.match(/@([\w.-]+)/)
  const senderDomain = domainMatch ? domainMatch[1].toLowerCase() : ''

  // 4. Run all intelligence gathering in parallel
  const prescan = provider === 'mercury' ? mercuryPrescan : haikuPrescan
  const [haikuRes, dnsRes, vtRes, sbRes, rdapRes] = await Promise.allSettled([
    prescan(email),
    senderDomain ? dnsLookup(senderDomain) : Promise.resolve<DnsResult>({ spf: 'none', dkim: 'error', dmarc: { policy: 'error', raw: '' }, error: 'no domain' }),
    virusTotalScan(email.urls),
    safeBrowsingCheck(email.urls),
    senderDomain ? rdapLookup(senderDomain) : Promise.resolve<RdapResult>({ registrationDate: null, ageInDays: null, riskLevel: 'UNKNOWN', registrar: null, error: 'no domain' }),
  ])

  // 5. Unwrap settled results (partial failures allowed)
  const haiku: HaikuResult = haikuRes.status === 'fulfilled'
    ? haikuRes.value
    : { pre_score: 0, signals: [], urls_found: [], escalate_to_sonnet: false, error: 'Haiku prescan failed' }

  const dns: DnsResult = dnsRes.status === 'fulfilled'
    ? dnsRes.value
    : { spf: 'error', dkim: 'error', dmarc: { policy: 'error', raw: '' }, error: 'DNS lookup failed' }

  const vt: VirusTotalResult = vtRes.status === 'fulfilled'
    ? vtRes.value
    : { flagged: false, results: [], error: 'VirusTotal scan failed' }

  const sb: SafeBrowsingResult = sbRes.status === 'fulfilled'
    ? sbRes.value
    : { flagged: false, threats: [], error: 'Safe Browsing check failed' }

  const rdap: RdapResult = rdapRes.status === 'fulfilled'
    ? rdapRes.value
    : { registrationDate: null, ageInDays: null, riskLevel: 'UNKNOWN', registrar: null, error: 'RDAP lookup failed' }

  // 6. Escalation check
  const escalate = haiku.escalate_to_sonnet || haiku.pre_score >= 26 || vt.flagged || sb.flagged

  // 7. Build report
  let report: Omit<AnalysisReport, 'duration_ms'>

  if (escalate) {
    try {
      const deepAnalysis = provider === 'mercury' ? mercuryDeepAnalysis : sonnetDeepAnalysis
      report = await deepAnalysis(email, { haiku, dns, vt, sb, rdap })
    } catch {
      // Fallback to fast report if AI deep analysis fails
      report = buildFastReport(haiku, dns, vt, sb, rdap)
    }
  } else {
    report = buildFastReport(haiku, dns, vt, sb, rdap)
  }

  return NextResponse.json({ ...report, duration_ms: Date.now() - start })
}

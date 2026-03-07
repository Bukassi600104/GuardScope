import { NextRequest, NextResponse } from 'next/server'
import type { EmailInput, AnalysisReport, DnsResult, VirusTotalResult, SafeBrowsingResult, RdapResult, AnalysisIntel } from '../../../lib/types'
import { mercuryAnalyze } from '../../../lib/inception'
import { dnsLookup } from '../../../lib/dns'
import { virusTotalScan } from '../../../lib/virustotal'
import { safeBrowsingCheck } from '../../../lib/safebrowsing'
import { rdapLookup } from '../../../lib/rdap'
import { isTrustedDomain, getTrustCategory } from '../../../lib/allowlist'
import { applyHybridScore } from '../../../lib/scorer'

const MAX_BODY_BYTES = 500_000

// ─── Rule-based fallback ─────────────────────────────────────────────────────
// Used only when Mercury-2 fails entirely (network error, API down, etc.)

function scoreToLevel(score: number): AnalysisReport['risk_level'] {
  if (score <= 25) return 'SAFE'
  if (score <= 49) return 'LOW'
  if (score <= 69) return 'MEDIUM'
  if (score <= 84) return 'HIGH'
  return 'CRITICAL'
}

function buildFallbackReport(
  intel: AnalysisIntel,
  error: string
): Omit<AnalysisReport, 'duration_ms'> {
  const green_flags: AnalysisReport['green_flags'] = []
  const red_flags: AnalysisReport['red_flags'] = []

  if (intel.dns.spf === 'pass') {
    green_flags.push({ label: 'SPF Pass', detail: 'Sender is authorized by the domain SPF record', module: 'sender_auth' })
  } else if (intel.dns.spf === 'fail') {
    red_flags.push({ label: 'SPF Fail', evidence: 'Sender is not authorized — spoofing likely', severity: 'HIGH', module: 'sender_auth' })
  } else if (intel.dns.spf === 'none') {
    red_flags.push({ label: 'SPF Missing', evidence: 'No SPF record — sender identity unverified', severity: 'MEDIUM', module: 'sender_auth' })
  } else if (intel.dns.spf === 'neutral') {
    red_flags.push({ label: 'SPF Permissive', evidence: 'SPF policy is permissive (~all/+all) — weak protection', severity: 'LOW', module: 'sender_auth' })
  }

  if (intel.dns.dkim === 'present') {
    green_flags.push({ label: 'DKIM Configured', detail: 'Domain has DKIM signing configured', module: 'sender_auth' })
  }
  // 'unknown' = selector not publicly discoverable — neutral, do not penalize
  // 'absent' kept for completeness but should not occur with the new selector-probing logic

  if (intel.dns.dmarc.policy === 'reject') {
    green_flags.push({ label: 'DMARC Reject', detail: 'Strong DMARC policy enforced', module: 'sender_auth' })
  } else if (intel.dns.dmarc.policy === 'quarantine') {
    green_flags.push({ label: 'DMARC Quarantine', detail: 'DMARC policy quarantines unauthorized emails', module: 'sender_auth' })
  } else if (intel.dns.dmarc.policy === 'none' || intel.dns.dmarc.policy === 'error') {
    red_flags.push({ label: 'DMARC Monitoring Only', evidence: 'DMARC is set to monitoring — no enforcement active', severity: 'LOW', module: 'sender_auth' })
  }

  if (intel.rdap.riskLevel === 'HIGH') {
    red_flags.push({ label: 'Newly Registered Domain', evidence: `Domain registered only ${intel.rdap.ageInDays} days ago`, severity: 'HIGH', module: 'domain_intel' })
  } else if (intel.rdap.riskLevel === 'MEDIUM') {
    red_flags.push({ label: 'Recently Registered Domain', evidence: `Domain registered ${intel.rdap.ageInDays} days ago`, severity: 'MEDIUM', module: 'domain_intel' })
  } else if (intel.rdap.riskLevel === 'LOW' && intel.rdap.ageInDays !== null) {
    green_flags.push({ label: 'Established Domain', detail: `Domain has been active for ${intel.rdap.ageInDays} days`, module: 'domain_intel' })
  }

  if (intel.vt.flagged) {
    const flaggedUrls = intel.vt.results.filter((r) => r.malicious > 0).map((r) => r.url)
    red_flags.push({ label: 'Malicious URLs Detected', evidence: `VirusTotal flagged: ${flaggedUrls.join(', ')}`, severity: 'CRITICAL', module: 'url_analysis' })
  }

  if (intel.sb.flagged) {
    const types = [...new Set(intel.sb.threats.map((t) => t.threatType))]
    red_flags.push({ label: 'Google Safe Browsing Alert', evidence: `Threat types: ${types.join(', ')}`, severity: 'CRITICAL', module: 'url_analysis' })
  }

  if (!intel.vt.flagged && !intel.sb.flagged) {
    green_flags.push({ label: 'URLs Clean', detail: 'No malicious URLs detected by threat intelligence', module: 'url_analysis' })
  }

  // Score from intel signals since Mercury is unavailable
  let score = 0
  if (intel.dns.spf === 'fail') score += 20
  else if (intel.dns.spf === 'none') score += 10
  else if (intel.dns.spf === 'neutral') score += 5
  if (intel.dns.dkim === 'absent') score += 10
  if (intel.dns.dmarc.policy === 'none' || intel.dns.dmarc.policy === 'error') score += 5
  if (intel.rdap.riskLevel === 'HIGH') score += 25
  else if (intel.rdap.riskLevel === 'MEDIUM') score += 10
  if (intel.vt.flagged) score += 40
  if (intel.sb.flagged) score += 40
  if (intel.trustHint) score = Math.max(0, score - 15)
  score = Math.min(100, score)

  const risk_level = scoreToLevel(score)

  return {
    risk_score: score,
    risk_level,
    verdict: `Fallback report — AI analysis unavailable (${error}). Rule-based assessment only.`,
    recommendation: risk_level === 'SAFE' ? 'No action required' : 'Do not click links or open attachments until verified',
    green_flags,
    red_flags,
    modules: {
      sender_auth: { spf: intel.dns.spf, dkim: intel.dns.dkim, dmarc: intel.dns.dmarc.policy },
      domain_intel: { age_days: intel.rdap.ageInDays, risk_level: intel.rdap.riskLevel, registrar: intel.rdap.registrar },
      content_analysis: { signals: [], urgency_score: 0, assessment: 'unknown' },
      url_analysis: { vt_flagged: intel.vt.flagged, sb_flagged: intel.sb.flagged, flagged_urls: [] },
      behavioral: {},
    },
    analysis_path: 'rule_based',
  }
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const start = Date.now()

  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body too large (max 500KB)' }, { status: 413 })
  }

  let body: Partial<EmailInput>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.fromEmail || !body.subject || !body.bodyText) {
    return NextResponse.json({ error: 'Missing required fields: fromEmail, subject, bodyText' }, { status: 400 })
  }

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

  const domainMatch = email.fromEmail?.match(/@([\w.-]+)/)
  const senderDomain = domainMatch ? domainMatch[1].toLowerCase() : ''

  // Allowlist check — will be passed to Mercury via intel object
  const trusted = isTrustedDomain(senderDomain)
  const trustCategory = getTrustCategory(senderDomain)

  const NO_DOMAIN_DNS: DnsResult = { spf: 'none', dkim: 'error', dmarc: { policy: 'error', raw: '' }, error: 'no domain' }
  const NO_DOMAIN_RDAP: RdapResult = { registrationDate: null, ageInDays: null, riskLevel: 'UNKNOWN', registrar: null, error: 'no domain' }

  // Gather all external intel in parallel — no AI call during this phase
  const [dnsRes, vtRes, sbRes, rdapRes] = await Promise.allSettled([
    senderDomain ? dnsLookup(senderDomain) : Promise.resolve(NO_DOMAIN_DNS),
    virusTotalScan(email.urls),
    safeBrowsingCheck(email.urls),
    senderDomain ? rdapLookup(senderDomain) : Promise.resolve(NO_DOMAIN_RDAP),
  ])

  const intel: AnalysisIntel = {
    dns: dnsRes.status === 'fulfilled' ? dnsRes.value : { spf: 'error', dkim: 'error', dmarc: { policy: 'error', raw: '' }, error: 'DNS failed' },
    vt: vtRes.status === 'fulfilled' ? vtRes.value : { flagged: false, results: [], error: 'VT failed' },
    sb: sbRes.status === 'fulfilled' ? sbRes.value : { flagged: false, threats: [], error: 'SB failed' },
    rdap: rdapRes.status === 'fulfilled' ? rdapRes.value : { registrationDate: null, ageInDays: null, riskLevel: 'UNKNOWN', registrar: null, error: 'RDAP failed' },
    ...(trusted && trustCategory ? {
      trustHint: `Sender domain "${senderDomain}" is a known-legitimate ${trustCategory} domain in GuardScope's allowlist.`
    } : {}),
  }

  // Mercury-2 deep analysis — every user gets full AI results
  let report: Omit<AnalysisReport, 'duration_ms'>
  try {
    const mercuryReport = await mercuryAnalyze(email, intel)
    // Apply hybrid scoring: rule_score * 0.35 + mercury_score * 0.65 + hard overrides
    report = applyHybridScore(mercuryReport, intel)
  } catch (err) {
    // Mercury unavailable — return rule-based fallback so users always get a response
    report = buildFallbackReport(intel, String(err))
  }

  return NextResponse.json({ ...report, duration_ms: Date.now() - start })
}


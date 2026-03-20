import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

// Extend Vercel function timeout beyond the default 10s.
// Mercury-2 analysis can take 5–15s; DNS + VT + SB run in parallel.
export const maxDuration = 60
import type { EmailInput, AnalysisReport, DnsResult, VirusTotalResult, SafeBrowsingResult, RdapResult, AnalysisIntel } from '../../../lib/types'
import { mercuryAnalyze } from '../../../lib/inception'
import { dnsLookup } from '../../../lib/dns'
import { virusTotalScan } from '../../../lib/virustotal'
import { safeBrowsingCheck } from '../../../lib/safebrowsing'
import { rdapLookup } from '../../../lib/rdap'
import { isTrustedDomain, getTrustCategory } from '../../../lib/allowlist'
import { isTopDomain } from '../../../lib/tranco'
import { applyHybridScore, calcRuleScore, scoreToLevel } from '../../../lib/scorer'
import { phishTankScan } from '../../../lib/phishtank'
import { urlHausScan } from '../../../lib/urlhaus'
import { spamhausCheck } from '../../../lib/spamhaus'
import { emailRepCheck } from '../../../lib/emailrep'
import { analyzeHeaders } from '../../../lib/headerAnalysis'
import { analyzeDomainSimilarity } from '../../../lib/domainSimilarity'
import { assessTldRisk } from '../../../lib/tldRisk'
import { normalizeUrls } from '../../../lib/urlCache'
import { decodeJwt, checkAndIncrementQuota, getUserTier } from '../../../lib/quota'
import { checkRateLimit } from '../../../lib/ratelimit'
import { getCachedResult, setCachedResult } from '../../../lib/cache'
import { createHash } from 'crypto'
import { buildCorsHeaders } from '../../../lib/cors'
import { Redis } from '@upstash/redis'

// Lazy Redis instance for anonymous monthly quota (reuses same Upstash credentials as ratelimit)
let _redis: Redis | null = null
function getRedis(): Redis | null {
  if (_redis) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_URL ?? ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_TOKEN ?? ''
  if (!url || !token) return null
  _redis = new Redis({ url, token })
  return _redis
}

const MAX_BODY_BYTES = 500_000

// ─── Rule-based fallback ─────────────────────────────────────────────────────
// Used only when Mercury-2 fails entirely (network error, API down, etc.)
// scoreToLevel is imported from scorer.ts for consistency

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

  // Header analysis flags
  if (intel.headerAnalysis?.replyToMismatch) {
    red_flags.push({ label: 'Reply-To Mismatch', evidence: `Reply-To domain (${intel.headerAnalysis.replyToDomain}) differs from sender domain — replies go to attacker`, severity: 'HIGH', module: 'header_integrity' })
  }
  if (intel.headerAnalysis?.displayNameMismatch) {
    red_flags.push({ label: 'Display Name Impersonation', evidence: `Email appears to be from "${intel.headerAnalysis.displayNameBrand}" but sender domain doesn't match`, severity: 'HIGH', module: 'header_integrity' })
  }
  if (intel.headerAnalysis?.attachmentRiskLevel === 'HIGH') {
    red_flags.push({ label: 'High-Risk Attachment', evidence: `Executable/script file attached: ${intel.headerAnalysis.riskyAttachments.join(', ')}`, severity: 'HIGH', module: 'attachments' })
  } else if (intel.headerAnalysis?.attachmentRiskLevel === 'MEDIUM') {
    red_flags.push({ label: 'Suspicious Attachment', evidence: `Potentially risky attachment: ${intel.headerAnalysis.riskyAttachments.join(', ')}`, severity: 'MEDIUM', module: 'attachments' })
  }
  if (intel.headerAnalysis?.ipAddressUrls.length) {
    red_flags.push({ label: 'IP Address URL', evidence: `Links use raw IP addresses instead of domain names: ${intel.headerAnalysis.ipAddressUrls.join(', ')}`, severity: 'HIGH', module: 'url_analysis' })
  }
  if (intel.domainSimilarity?.isLookalike) {
    const ds = intel.domainSimilarity
    red_flags.push({ label: 'Lookalike Domain', evidence: ds.detail ?? `Sender domain resembles "${ds.targetBrand}" — ${ds.technique}`, severity: ds.confidence === 'HIGH' ? 'HIGH' : 'MEDIUM', module: 'domain_intel' })
  }

  // Use calcRuleScore for consistent fallback scoring (same as main path)
  const score = Math.min(100, calcRuleScore(intel))
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

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY)!

async function saveAnalysisHistory(
  userId: string,
  fromDomain: string,
  report: Omit<AnalysisReport, 'duration_ms'>,
  duration_ms: number
): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/analysis_history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      user_id: userId,
      from_domain: fromDomain || 'unknown',
      risk_level: report.risk_level,
      risk_score: report.risk_score,
      analysis_path: report.analysis_path,
      duration_ms,
    }),
  })
}

const STATIC_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
}

function getHeaders(req: NextRequest): Record<string, string> {
  return { ...STATIC_HEADERS, ...buildCorsHeaders(req) }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getHeaders(req) })
}

export async function POST(req: NextRequest) {
  const start = Date.now()
  const SECURITY_HEADERS = getHeaders(req)

  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body too large (max 500KB)' }, { status: 413, headers: SECURITY_HEADERS })
  }

  let body: Partial<EmailInput>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: SECURITY_HEADERS })
  }

  if (!body.fromEmail || !body.subject || !body.bodyText) {
    return NextResponse.json({ error: 'Missing required fields: fromEmail, subject, bodyText' }, { status: 400, headers: SECURITY_HEADERS })
  }

  // Basic email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.fromEmail)) {
    return NextResponse.json({ error: 'Invalid fromEmail format' }, { status: 400, headers: SECURITY_HEADERS })
  }

  // bodyText size cap (belt-and-suspenders — truncation also happens in inception.ts)
  if (typeof body.bodyText === 'string' && body.bodyText.length > 50_000) {
    return NextResponse.json({ error: 'bodyText too large (max 50KB)' }, { status: 413, headers: SECURITY_HEADERS })
  }

  const email: EmailInput = {
    fromName: body.fromName ?? null,
    fromEmail: body.fromEmail,
    subject: body.subject,
    date: body.date ?? null,
    bodyText: body.bodyText,
    urls: normalizeUrls(Array.isArray(body.urls) ? body.urls : []),
    anchorLinks: Array.isArray(body.anchorLinks) ? body.anchorLinks : undefined,
    attachments: Array.isArray(body.attachments) ? body.attachments : [],
    replyTo: body.replyTo ?? null,
    returnPath: (body as EmailInput).returnPath ?? null,
    xMailer: (body as EmailInput).xMailer ?? null,
    messageId: body.messageId ?? null,
    gmailAuth: body.gmailAuth ?? undefined,
    gmailWarning: (body as EmailInput).gmailWarning ?? undefined,
  }

  // ── Rate Limit + JWT Auth + Quota ────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const jwtPayload = token ? await decodeJwt(token) : null
  const userId = jwtPayload?.sub ?? null

  // Rate limit: per user_id if authed, per IP if anon.
  // Sanitize the IP — on Vercel the CDN sets this, but we validate it defensively.
  // Accept only IPv4/IPv6-looking strings to prevent Redis key injection.
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const ip = /^[0-9a-fA-F.:]{3,45}$/.test(rawIp) ? rawIp : 'unknown'
  const rateLimitId = userId ?? `ip:${ip}`
  const rateLimit = await checkRateLimit(rateLimitId, !!userId)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retry_after_ms: rateLimit.resetAt - Date.now() },
      {
        status: 429,
        headers: {
          ...SECURITY_HEADERS,  // CORS must be present or extension sees opaque network error
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    )
  }

  if (userId) {
    const tier = await getUserTier(userId)
    const quota = await checkAndIncrementQuota(userId, tier)
    if (!quota.allowed) {
      return NextResponse.json(
        { error: 'limit_reached', count: quota.count, limit: quota.limit, message: 'Monthly analysis limit reached. Upgrade to Pro for unlimited analyses.' },
        { status: 429 }
      )
    }
  } else {
    // Anonymous users (unauthenticated or expired JWT): 5 analyses/month per IP hash.
    // IP is hashed with month+year so the identifier rotates monthly (privacy-safe).
    // 'unknown' IPs (e.g. proxies that strip x-forwarded-for) are allowed through — best-effort.
    // Uses Redis INCR — the Supabase usage table has a FK to auth.users so anon UUIDs fail silently.
    if (ip !== 'unknown') {
      const now = new Date()
      const hash = createHash('sha256')
        .update(`anon:${ip}:${now.getFullYear()}:${now.getMonth()}`)
        .digest('hex')
      const redis = getRedis()
      if (redis) {
        try {
          const key = `gs:anon_monthly:${hash.slice(0, 32)}:${now.getFullYear()}:${now.getMonth() + 1}`
          const count = await redis.incr(key)
          // Set TTL on first scan — ~35 days covers end-of-month rollover
          if (count === 1) await redis.expire(key, 35 * 24 * 60 * 60)
          if (count > 5) {
            return NextResponse.json(
              { error: 'limit_reached', count, limit: 5, message: 'Monthly analysis limit reached. Sign in to continue.' },
              { status: 429, headers: SECURITY_HEADERS }
            )
          }
        } catch {
          // Redis error — fail open (don't block users for infra issues)
        }
      }
    }
  }

  // ── Result cache — same email always returns same score within 24h ─────────
  // Eliminates AI non-determinism variance between repeated scans of the same email.
  //
  // Cache key strategy:
  //   1. messageId — preferred, immutable RFC 2822 header, uniquely identifies the email
  //   2. Fallback — fromEmail + subject + date + sorted URLs + first 400 chars of body
  //      URLs are SORTED to neutralise DOM ordering variance between repeated extractions.
  //      Body is truncated to 400 chars (stable across Gmail re-renders of the same email).
  //      Full body was previously used but Gmail re-renders cause minor text differences
  //      each time, producing different hashes and defeating the cache entirely.
  const stableKeyInput = email.messageId
    ? `msgid:${email.messageId}`
    : `${email.fromEmail}:${email.subject}:${email.date ?? ''}:${[...email.urls].sort().join(',')}:${(email.bodyText ?? '').slice(0, 400)}`
  const cacheKey = 'gs:v2:' + createHash('sha256')
    .update(stableKeyInput)
    .digest('hex')
    .slice(0, 40)

  const cached = await getCachedResult(cacheKey)
  if (cached) {
    return NextResponse.json(cached, { headers: SECURITY_HEADERS })
  }

  const domainMatch = email.fromEmail?.match(/@([\w.-]+)/)
  const senderDomain = domainMatch ? domainMatch[1].toLowerCase() : ''

  // Free email provider detection — gmail/yahoo/hotmail senders don't get trust cap benefit
  // because attackers commonly send phishing from free providers
  const FREE_PROVIDERS = new Set([
    // ── US / Global ─────────────────────────────────────────────────────────
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.ng',
    'yahoo.de', 'yahoo.es', 'yahoo.it', 'yahoo.ca', 'yahoo.com.au', 'yahoo.co.in',
    'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.es', 'hotmail.it',
    'outlook.com', 'live.com', 'live.co.uk', 'live.fr', 'live.de', 'live.it',
    'ymail.com', 'icloud.com', 'me.com', 'mac.com', 'protonmail.com', 'proton.me',
    'zoho.com', 'aol.com', 'mail.com', 'inbox.com', 'fastmail.com', 'fastmail.fm',
    // ── German / Austrian / Swiss ────────────────────────────────────────────
    'web.de', 'gmx.de', 'gmx.net', 'gmx.com', 'gmx.at', 'gmx.ch', 'gmx.us',
    't-online.de', 'freenet.de', 'arcor.de', 'posteo.de', 'mailbox.org',
    // ── Italian ──────────────────────────────────────────────────────────────
    'libero.it', 'virgilio.it', 'tiscali.it', 'alice.it', 'tin.it',
    'email.it', 'iol.it', 'katamail.com', 'inwind.it',
    // ── French ───────────────────────────────────────────────────────────────
    'laposte.net', 'sfr.fr', 'orange.fr', 'free.fr', 'bbox.fr', 'numericable.fr',
    'wanadoo.fr', 'club-internet.fr', 'neuf.fr',
    // ── Russian / Ukrainian ───────────────────────────────────────────────────
    'mail.ru', 'inbox.ru', 'list.ru', 'bk.ru', 'rambler.ru', 'yandex.com', 'yandex.ru',
    'yandex.ua', 'ukr.net', 'i.ua', 'meta.ua',
    // ── Chinese ───────────────────────────────────────────────────────────────
    'qq.com', '163.com', '126.com', 'sina.com', 'sohu.com', '139.com', '189.cn',
    // ── Other Asian ───────────────────────────────────────────────────────────
    'naver.com', 'hanmail.net', 'daum.net', 'rediffmail.com', 'sify.com',
    // ── Spanish / Latin America ───────────────────────────────────────────────
    'terra.com.br', 'uol.com.br', 'bol.com.br', 'ig.com.br', 'globo.com',
    // ── African / Nigerian ────────────────────────────────────────────────────
    'yahoo.com.ng', 'rocketmail.com',
  ])
  const isFreeProvider = FREE_PROVIDERS.has(senderDomain)

  // Allowlist + Tranco check — will be passed to Mercury via intel object
  // Free providers are intentionally excluded from trust benefit
  const trusted = !isFreeProvider && (isTrustedDomain(senderDomain) || isTopDomain(senderDomain))
  const trustCategory = trusted ? (getTrustCategory(senderDomain) ?? (isTopDomain(senderDomain) ? 'global_tech' : null)) : null

  const NO_DOMAIN_DNS: DnsResult = { spf: 'none', dkim: 'error', dmarc: { policy: 'error', raw: '' }, error: 'no domain' }
  const NO_DOMAIN_RDAP: RdapResult = { registrationDate: null, ageInDays: null, riskLevel: 'UNKNOWN', registrar: null, error: 'no domain' }

  // Deterministic analysis (no network calls needed)
  const headerAnalysis = analyzeHeaders(email)
  const domainSimilarity = senderDomain ? analyzeDomainSimilarity(senderDomain) : undefined
  const tldRisk = senderDomain ? assessTldRisk(senderDomain) : undefined

  // URL domain similarity: check all non-trusted URL domains for lookalike patterns
  const urlDomains = [...new Set(email.urls.map(u => {
    try { return new URL(u).hostname.toLowerCase().replace(/^www\./, '') } catch { return null }
  }).filter((d): d is string => !!d && d !== senderDomain))]

  const urlDomainSimilarityResults = urlDomains
    .filter(d => !isTopDomain(d) && !isTrustedDomain(d))
    .slice(0, 10)  // cap at 10 URL domains to avoid excessive computation
    .map(d => analyzeDomainSimilarity(d))
    .filter(r => r.isLookalike)

  // emailRepCheck is synchronous (deterministic disposable domain check — no network)
  const emailRepResult = email.fromEmail
    ? emailRepCheck(email.fromEmail)
    : { suspicious: false, blacklisted: false, disposable: false, maliciousActivity: false, spoofing: false }

  // Gather all external intel in parallel — no AI call during this phase
  const [dnsRes, vtRes, sbRes, rdapRes, ptRes, uhRes, spamhausRes] = await Promise.allSettled([
    senderDomain ? dnsLookup(senderDomain) : Promise.resolve(NO_DOMAIN_DNS),
    virusTotalScan(email.urls),
    safeBrowsingCheck(email.urls),
    senderDomain ? rdapLookup(senderDomain) : Promise.resolve(NO_DOMAIN_RDAP),
    phishTankScan(email.urls),
    urlHausScan(email.urls, senderDomain || undefined),
    senderDomain ? spamhausCheck(senderDomain) : Promise.resolve({ checked: false, dblPhishing: false, dblMalware: false, dblSpam: false, sblListed: false }),
  ])

  const intel: AnalysisIntel = {
    dns: dnsRes.status === 'fulfilled' ? dnsRes.value : { spf: 'error', dkim: 'error', dmarc: { policy: 'error', raw: '' }, hasMx: true, error: 'DNS failed' },
    vt: vtRes.status === 'fulfilled' ? vtRes.value : { flagged: false, results: [], error: 'VT failed' },
    sb: sbRes.status === 'fulfilled' ? sbRes.value : { flagged: false, threats: [], error: 'SB failed' },
    rdap: rdapRes.status === 'fulfilled' ? rdapRes.value : { registrationDate: null, ageInDays: null, riskLevel: 'UNKNOWN', registrar: null, error: 'RDAP failed' },
    phishtank: ptRes.status === 'fulfilled' ? ptRes.value : { flagged: false, phishingUrls: [], error: 'PhishTank failed' },
    urlhaus: uhRes.status === 'fulfilled' ? uhRes.value : { flagged: false, malwareUrls: [], error: 'URLhaus failed' },
    spamhaus: spamhausRes.status === 'fulfilled' ? spamhausRes.value : { checked: false, dblPhishing: false, dblMalware: false, dblSpam: false, sblListed: false, error: 'Spamhaus failed' },
    emailRep: emailRepResult,
    headerAnalysis,
    ...(domainSimilarity ? { domainSimilarity } : {}),
    ...(urlDomainSimilarityResults.length > 0 ? { urlDomainSimilarity: urlDomainSimilarityResults } : {}),
    ...(tldRisk ? { tldRisk } : {}),
    ...(trusted && trustCategory ? {
      trustHint: `Sender domain "${senderDomain}" is a known-legitimate ${trustCategory} domain in GuardScope's allowlist.`
    } : {}),
    ...(isFreeProvider ? { freeProvider: true } : {}),
    ...(email.gmailWarning ? { gmailWarning: true } : {}),
  }

  // Mercury-2 deep analysis — comprehensive AI report for every request.
  // EXCEPTION: Skip Mercury if confirmed CRITICAL threat intel hit exists.
  // When VT/SB/PhishTank/URLhaus flags a URL, score is already pinned to 85+
  // by the hard override. Mercury can't add meaningful information — skip the
  // 10-15s latency and return a high-quality rule-based CRITICAL report immediately.
  const confirmedThreat = intel.vt.flagged || intel.sb.flagged ||
    intel.phishtank?.flagged || intel.urlhaus?.flagged
  let report: Omit<AnalysisReport, 'duration_ms'>

  if (confirmedThreat) {
    // Fast path: confirmed threat intel hit — no need to invoke Mercury
    report = buildFallbackReport(intel, 'fast_path_threat_confirmed')
    // Override the "fallback" labels since this is a deliberate fast path, not a failure
    report = {
      ...report,
      verdict: report.verdict.replace('Fallback report — AI analysis unavailable', 'Confirmed threat detected by security intelligence'),
      analysis_path: 'rule_based',
    }
    report = applyHybridScore(report, intel, email.subject)  // still apply scoring overrides
  } else {
    // Normal path: full Mercury-2 deep analysis
    try {
      const mercuryReport = await mercuryAnalyze(email, intel)
      report = applyHybridScore(mercuryReport, intel, email.subject)
    } catch (err) {
      // Mercury unavailable — return rule-based fallback so users always get a response
      Sentry.captureException(err, { extra: { fromEmail: email.fromEmail, senderDomain } })
      // Obfuscate internal error details from user-facing response
      const userFacingError = (err instanceof Error && err.message.includes('API'))
        ? 'AI analysis temporarily unavailable'
        : 'AI analysis temporarily unavailable'
      report = buildFallbackReport(intel, userFacingError)
    }
  }

  const duration_ms = Date.now() - start
  const finalReport = { ...report, duration_ms }

  // Cache the result — fire-and-forget, non-blocking
  setCachedResult(cacheKey, finalReport).catch(() => { /* non-critical */ })

  // Fire-and-forget: save analysis metadata to history (no email content stored)
  if (userId) {
    saveAnalysisHistory(userId, senderDomain, report, duration_ms).catch(() => { /* non-critical */ })
  }

  return NextResponse.json(finalReport, { headers: SECURITY_HEADERS })
}


/**
 * GuardScope Hybrid Scoring Engine
 *
 * Formula: final = rule_score * 0.35 + mercury_score * 0.65
 *
 * Hard overrides always win regardless of formula result:
 *   - Any threat intel hit (VT/SB/PhishTank/URLhaus) → minimum 85
 *   - Display name brand impersonation → minimum 70
 *   - Domain similarity HIGH confidence → minimum 70
 *   - SPF fail + newly-registered domain → minimum 70
 *   - Reply-To mismatch + new domain → minimum 65
 *   - Risky attachment (HIGH) + non-trusted sender → minimum 60
 *   - Trusted allowlisted domain + no threat hits + no header flags → maximum 40
 *
 * Risk thresholds (standardized across scorer + route + Mercury prompt):
 *   0–25:  SAFE
 *   26–49: LOW
 *   50–69: MEDIUM
 *   70–84: HIGH
 *   85+:   CRITICAL
 */

import type { AnalysisIntel, AnalysisReport } from './types'

// Business/financial/legal claim subjects from free providers — red flag
const BUSINESS_CLAIM_SUBJECT_RE = /\b(invoice|payment|transaction|order confirmation|receipt|account|wire transfer|bank transfer|funds|remittance|settlement|refund|compensation|beneficiary|inheritance|lottery|prize|winning|job offer|employment|investment|opportunity|copyright|dmca|takedown|strike|violation|infringement|intellectual property|legal notice|legal action|lawsuit|claim|dispute|cease and desist|content removal|channel|monetization|terminated|suspended|verify|verification|confirm|urgent|immediate action|final notice|last warning)\b/i

// ─── Self-Built Registrar Risk Engine ────────────────────────────────────────
// Source: Spamhaus abuse statistics, CISA advisories, brand protection research.
// Registrar risk is NOT standalone — it compounds with other signals.
// High-risk registrars have disproportionate abuse rates in phishing/malware campaigns.
// Reference: https://www.spamhaus.org/statistics/registrars/

const HIGH_RISK_REGISTRAR_KEYWORDS = [
  'eranet',       // Eranet International Limited — bulletproof-adjacent, China
  'shinjiru',     // Shinjiru Technology — bulletproof hosting, Malaysia
  'bizcn',        // Bizcn.com — high phishing/malware, China
  'west263',      // West263 International — high spam, China
  'xinnet',       // Xin Net Technology — China, high abuse
  'hichina',      // HiChina / Alibaba Cloud domain arm
  'todaynic',     // Todaynic.com — China-based, spam-heavy
  'webnic',       // Web Commerce / WebNic — Southeast Asia, moderate abuse
]

const MEDIUM_RISK_REGISTRAR_KEYWORDS = [
  'openprovider',           // Hosting Concepts B.V. — European, moderate abuse
  'hosting concepts',       // same company
  'publicdomainregistry',   // PDR Ltd. — high volume, moderate abuse rate
  'pdr ltd',                // same company
]

/**
 * Returns the abuse-risk tier of a registrar based on industry research.
 * Only meaningful when COMBINED with other signals (new domain, bad TLD, etc.).
 */
function registrarRisk(registrar: string | null): 'HIGH' | 'MEDIUM' | 'NONE' {
  if (!registrar) return 'NONE'
  const lower = registrar.toLowerCase()
  if (HIGH_RISK_REGISTRAR_KEYWORDS.some(k => lower.includes(k))) return 'HIGH'
  if (MEDIUM_RISK_REGISTRAR_KEYWORDS.some(k => lower.includes(k))) return 'MEDIUM'
  return 'NONE'
}

/**
 * Calculate the deterministic rule-based pre-score from all available intel signals.
 * This score anchors the LLM to prevent hallucinated risk level drift.
 */
export function calcRuleScore(intel: AnalysisIntel, subject?: string | null): number {
  let score = 0

  // ── Sender Authentication ────────────────────────────────────────────────
  if (intel.dns.spf === 'fail')        score += 20
  else if (intel.dns.spf === 'none')   score += 10
  else if (intel.dns.spf === 'neutral') score += 5

  // DKIM: only penalize 'absent' (explicitly not configured) — 'unknown' is neutral
  if (intel.dns.dkim === 'absent')     score += 8

  // DMARC: reward enforcement, mildly penalize missing
  if (intel.dns.dmarc.policy === 'none')  score += 5
  else if (intel.dns.dmarc.policy === 'error') score += 3

  // MX records missing: domain can't legitimately receive email → suspicious
  if (intel.dns.hasMx === false)       score += 10

  // ── Domain Intelligence ───────────────────────────────────────────────────
  if (intel.rdap.riskLevel === 'HIGH')   score += 25   // < 30 days old
  else if (intel.rdap.riskLevel === 'MEDIUM') score += 12  // 30–90 days old

  // ── TLD Risk ─────────────────────────────────────────────────────────────
  if (intel.tldRisk?.isFreeRegistration) score += 18   // .tk/.ml/.ga/.cf/.gq — massively abused
  else if (intel.tldRisk?.isHighRisk)    score += 10   // .xyz/.top/.click etc.

  // ── URL Threat Intelligence ───────────────────────────────────────────────
  if (intel.vt.flagged)               score += 40
  if (intel.sb.flagged)               score += 40
  if (intel.phishtank?.flagged)       score += 35
  if (intel.urlhaus?.flagged)         score += 35

  // ── Spamhaus DBL ─────────────────────────────────────────────────────────
  if (intel.spamhaus?.dblPhishing)    score += 40
  if (intel.spamhaus?.dblMalware)     score += 45
  if (intel.spamhaus?.dblSpam)        score += 25

  // ── Email / Sender Reputation ────────────────────────────────────────────
  if (intel.emailRep?.blacklisted)    score += 35
  if (intel.emailRep?.maliciousActivity) score += 30
  if (intel.emailRep?.suspicious)     score += 20
  if (intel.emailRep?.disposable)     score += 25
  if (intel.emailRep?.spoofing)       score += 20

  // ── Registrar Risk ────────────────────────────────────────────────────────
  // High-risk registrars are NOT penalized alone (millions of legit users).
  // Only meaningful compound with new domain or bad TLD.
  const regRisk = registrarRisk(intel.rdap.registrar)
  if (regRisk === 'HIGH' && intel.rdap.riskLevel === 'HIGH')   score += 20  // high-risk registrar + brand-new domain
  else if (regRisk === 'HIGH' && intel.rdap.riskLevel === 'MEDIUM') score += 10
  else if (regRisk === 'MEDIUM' && intel.rdap.riskLevel === 'HIGH') score += 8

  // ── Gmail Security Warning ───────────────────────────────────────────────
  if (intel.gmailWarning)             score += 30

  // ── Header Analysis Signals ──────────────────────────────────────────────
  if (intel.headerAnalysis) {
    const ha = intel.headerAnalysis

    // Reply-To mismatch: HIGH signal — attacker intercepts replies
    if (ha.replyToMismatch)            score += 25

    // Return-Path mismatch: spoofing indicator
    if (ha.returnPathMismatch)         score += 20

    // Display name brand impersonation: CRITICAL signal
    if (ha.displayNameMismatch)        score += 30

    // Risky attachments
    if (ha.attachmentRiskLevel === 'HIGH')   score += 25
    else if (ha.attachmentRiskLevel === 'MEDIUM') score += 10

    // IP address URLs: no legitimate org links to raw IPs
    if (ha.ipAddressUrls.length > 0)   score += 20

    // data:/javascript: URIs — always malicious in email
    if (ha.hasDataUri || ha.hasJavascriptUri) score += 35

    // URL shorteners: destination unknown — phishers commonly abuse them
    if (ha.shortenerUrls.length > 0)   score += 12
    if (ha.shortenerUrls.length >= 3)  score += 8   // multiple shorteners = higher risk

    // URL path impersonation: brand name in path on non-brand domain
    if (ha.urlPathImpersonations.length > 0) score += 25

    // Suspicious mailer software
    if (ha.suspiciousMailer)           score += 8

    // Anchor text mismatch: link text domain ≠ href domain
    if (ha.anchorTextMismatches.length > 0)  score += 20
    if (ha.anchorTextMismatches.length >= 3) score += 10  // multiple = coordinated attack

    // BEC authority title in display name (CEO, CFO, Attorney, FBI Agent, etc.)
    if (ha.authorityImpersonation) {
      score += 25
      if (ha.authorityCategory === 'government') score += 10  // government/LE titles = higher urgency
    }
  }

  // ── Domain Similarity ────────────────────────────────────────────────────
  if (intel.domainSimilarity?.isLookalike) {
    const ds = intel.domainSimilarity
    if (ds.confidence === 'HIGH')      score += 30
    else if (ds.confidence === 'MEDIUM') score += 18
  }

  // URL domain similarity: lookalike in email links (not just sender domain)
  if (intel.urlDomainSimilarity?.some(r => r.isLookalike && r.confidence === 'HIGH')) {
    score += 28
  } else if (intel.urlDomainSimilarity?.some(r => r.isLookalike)) {
    score += 15
  }

  // ── Compound Signal Synergy ───────────────────────────────────────────────
  // Multiple weak signals together compound into a stronger signal
  const dns = intel.dns
  const rdap = intel.rdap
  const ha = intel.headerAnalysis

  // New domain + no DMARC + no SPF
  if (rdap.riskLevel === 'HIGH' && dns.spf === 'none' && dns.dmarc.policy === 'error') score += 10

  // Free provider + business/financial subject line
  if (intel.freeProvider && subject && BUSINESS_CLAIM_SUBJECT_RE.test(subject)) score += 15

  // Reply-To mismatch + free provider
  if (ha?.replyToMismatch && intel.freeProvider) score += 15

  // URL shortener + free provider + suspicious context
  if (ha?.shortenerUrls.length && intel.freeProvider) score += 10

  // Authority title (BEC) compound signals
  if (ha?.authorityImpersonation) {
    // Authority title + free provider = classic BEC setup
    if (intel.freeProvider) score += 20
    // Authority title + reply-to mismatch = attacker harvesting replies
    if (ha.replyToMismatch) score += 15
    // Authority title + business/financial subject = strong BEC indicator
    if (subject && BUSINESS_CLAIM_SUBJECT_RE.test(subject)) score += 20
  }

  // High risk TLD + new domain + privacy proxy-style registrar
  if (intel.tldRisk?.isHighRisk && rdap.riskLevel !== 'LOW' && rdap.riskLevel !== 'UNKNOWN') score += 10

  // High-risk registrar + high-risk TLD = classic phishing campaign infrastructure
  if (regRisk === 'HIGH' && intel.tldRisk?.isHighRisk) score += 15

  // High-risk registrar + new domain + no SPF = throwaway attack domain
  if (regRisk === 'HIGH' && rdap.riskLevel === 'HIGH' && dns.spf === 'none') score += 10

  // ── Trust allowlist: known-good senders get benefit of doubt ─────────────
  if (intel.trustHint) score = Math.max(0, score - 15)

  return Math.min(100, score)
}

/**
 * Apply hybrid formula + hard overrides to produce the final anchored score.
 * Modifies and returns the report.
 */
export function applyHybridScore(
  report: Omit<AnalysisReport, 'duration_ms'>,
  intel: AnalysisIntel,
  subject?: string | null
): Omit<AnalysisReport, 'duration_ms'> {
  const mercuryScore = report.risk_score
  const ruleScore = calcRuleScore(intel, subject)

  // Hybrid blend: rule anchors Mercury's score
  let finalScore = Math.round(ruleScore * 0.35 + mercuryScore * 0.65)

  // ── Hard overrides — floor minimums (technical) ───────────────────────────
  const anyThreatHit = intel.vt.flagged || intel.sb.flagged ||
    intel.phishtank?.flagged || intel.urlhaus?.flagged ||
    intel.spamhaus?.dblPhishing || intel.spamhaus?.dblMalware

  // Confirmed threat intel → CRITICAL minimum
  if (anyThreatHit) {
    finalScore = Math.max(finalScore, 85)
  }

  // Spamhaus DBL spam (not phishing — lower confidence) → HIGH minimum
  if (intel.spamhaus?.dblSpam) {
    finalScore = Math.max(finalScore, 55)
  }

  // Display name brand impersonation → HIGH minimum
  if (intel.headerAnalysis?.displayNameMismatch) {
    finalScore = Math.max(finalScore, 70)
  }

  // Domain similarity HIGH confidence (sender domain) → HIGH minimum
  if (intel.domainSimilarity?.isLookalike && intel.domainSimilarity.confidence === 'HIGH') {
    finalScore = Math.max(finalScore, 70)
  }

  // URL domain similarity HIGH confidence → HIGH minimum
  if (intel.urlDomainSimilarity?.some(r => r.isLookalike && r.confidence === 'HIGH')) {
    finalScore = Math.max(finalScore, 75)
  }

  // data:/javascript: URIs → CRITICAL minimum
  if (intel.headerAnalysis?.hasDataUri || intel.headerAnalysis?.hasJavascriptUri) {
    finalScore = Math.max(finalScore, 85)
  }

  // URL path impersonation detected → HIGH minimum
  if (intel.headerAnalysis?.urlPathImpersonations?.length) {
    finalScore = Math.max(finalScore, 65)
  }

  // SPF fail + newly registered domain → HIGH minimum
  if (intel.dns.spf === 'fail' && intel.rdap.riskLevel === 'HIGH') {
    finalScore = Math.max(finalScore, 70)
  }

  // Reply-To mismatch + new domain → HIGH minimum
  if (intel.headerAnalysis?.replyToMismatch && intel.rdap.riskLevel === 'HIGH') {
    finalScore = Math.max(finalScore, 65)
  }

  // Return-Path mismatch (from non-ESP) → MEDIUM minimum
  if (intel.headerAnalysis?.returnPathMismatch) {
    finalScore = Math.max(finalScore, 50)
  }

  // Risky attachment (HIGH type) from non-trusted sender → MEDIUM minimum
  if (intel.headerAnalysis?.attachmentRiskLevel === 'HIGH' && !intel.trustHint) {
    finalScore = Math.max(finalScore, 55)
  }

  // Authority title impersonation (BEC signal) → MEDIUM-HIGH minimum
  if (intel.headerAnalysis?.authorityImpersonation) {
    finalScore = Math.max(finalScore, 55)
    // Authority + free provider = elevated BEC risk → HIGH minimum
    if (intel.freeProvider) finalScore = Math.max(finalScore, 65)
    // Government/LE title impersonation → HIGH minimum (used in gov scams)
    if (intel.headerAnalysis.authorityCategory === 'government') finalScore = Math.max(finalScore, 70)
  }

  // emailrep blacklisted sender → HIGH minimum
  if (intel.emailRep?.blacklisted) {
    finalScore = Math.max(finalScore, 65)
  }

  // Gmail's own warning → MEDIUM minimum
  if (intel.gmailWarning) {
    finalScore = Math.max(finalScore, 55)
  }

  // Free TLD (.tk/.ml/.ga etc.) → MEDIUM minimum
  if (intel.tldRisk?.isFreeRegistration) {
    finalScore = Math.max(finalScore, 45)
  }

  // ── Trust cap — allowlisted domain ceiling ─────────────────────────────
  // freeProvider: gmail.com/yahoo.com senders DON'T get the trust cap
  // (an attacker can send from gmail.com and should score normally)
  if (intel.trustHint && !anyThreatHit && !intel.freeProvider) {
    // Only apply cap if no header-level impersonation either
    const hasHeaderFlags = intel.headerAnalysis?.displayNameMismatch ||
      intel.headerAnalysis?.replyToMismatch ||
      intel.headerAnalysis?.returnPathMismatch ||
      intel.headerAnalysis?.authorityImpersonation ||
      intel.domainSimilarity?.isLookalike ||
      intel.urlDomainSimilarity?.some(r => r.isLookalike)
    if (!hasHeaderFlags) {
      finalScore = Math.min(finalScore, 40)
    }
  }

  finalScore = Math.max(0, Math.min(100, finalScore))

  return {
    ...report,
    risk_score: finalScore,
    risk_level: scoreToLevel(finalScore),
  }
}

/**
 * Standardized score → risk level mapping.
 * Used by both the main scorer and the rule-based fallback in route.ts.
 * IMPORTANT: Keep in sync with Mercury SYSTEM_PROMPT scoring rules.
 */
export function scoreToLevel(score: number): AnalysisReport['risk_level'] {
  if (score <= 25) return 'SAFE'
  if (score <= 49) return 'LOW'
  if (score <= 69) return 'MEDIUM'
  if (score <= 84) return 'HIGH'
  return 'CRITICAL'
}

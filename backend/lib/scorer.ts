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

/**
 * Calculate the deterministic rule-based pre-score from all available intel signals.
 * This score anchors the LLM to prevent hallucinated risk level drift.
 */
export function calcRuleScore(intel: AnalysisIntel): number {
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

  // ── URL Threat Intelligence ───────────────────────────────────────────────
  if (intel.vt.flagged)               score += 40
  if (intel.sb.flagged)               score += 40
  if (intel.phishtank?.flagged)       score += 35
  if (intel.urlhaus?.flagged)         score += 35

  // ── Header Analysis Signals (NEW) ─────────────────────────────────────────
  if (intel.headerAnalysis) {
    const ha = intel.headerAnalysis

    // Reply-To mismatch: HIGH signal — attacker intercepts replies
    if (ha.replyToMismatch)            score += 25

    // Display name brand impersonation: CRITICAL signal
    if (ha.displayNameMismatch)        score += 30

    // Risky attachments
    if (ha.attachmentRiskLevel === 'HIGH')   score += 25
    else if (ha.attachmentRiskLevel === 'MEDIUM') score += 10

    // IP address URLs: no legitimate org links to raw IPs
    if (ha.ipAddressUrls.length > 0)   score += 20

    // data:/javascript: URIs — always malicious in email
    if (ha.hasDataUri || ha.hasJavascriptUri) score += 35

    // Anchor text mismatch: link text domain ≠ href domain
    if (ha.anchorTextMismatches.length > 0)  score += 20
    if (ha.anchorTextMismatches.length >= 3) score += 10  // multiple = coordinated attack
  }

  // ── Domain Similarity (NEW) ───────────────────────────────────────────────
  if (intel.domainSimilarity?.isLookalike) {
    const ds = intel.domainSimilarity
    if (ds.confidence === 'HIGH')      score += 30
    else if (ds.confidence === 'MEDIUM') score += 18
  }

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
  intel: AnalysisIntel
): Omit<AnalysisReport, 'duration_ms'> {
  const mercuryScore = report.risk_score
  const ruleScore = calcRuleScore(intel)

  // Hybrid blend: rule anchors Mercury's score
  let finalScore = Math.round(ruleScore * 0.35 + mercuryScore * 0.65)

  // ── Hard overrides — floor minimums ──────────────────────────────────────
  const anyThreatHit = intel.vt.flagged || intel.sb.flagged ||
    intel.phishtank?.flagged || intel.urlhaus?.flagged

  // Confirmed threat intel → CRITICAL minimum
  if (anyThreatHit) {
    finalScore = Math.max(finalScore, 85)
  }

  // Display name brand impersonation → HIGH minimum
  if (intel.headerAnalysis?.displayNameMismatch) {
    finalScore = Math.max(finalScore, 70)
  }

  // Domain similarity HIGH confidence → HIGH minimum
  if (intel.domainSimilarity?.isLookalike && intel.domainSimilarity.confidence === 'HIGH') {
    finalScore = Math.max(finalScore, 70)
  }

  // data:/javascript: URIs → CRITICAL minimum
  if (intel.headerAnalysis?.hasDataUri || intel.headerAnalysis?.hasJavascriptUri) {
    finalScore = Math.max(finalScore, 85)
  }

  // SPF fail + newly registered domain → HIGH minimum
  if (intel.dns.spf === 'fail' && intel.rdap.riskLevel === 'HIGH') {
    finalScore = Math.max(finalScore, 70)
  }

  // Reply-To mismatch + new domain → HIGH minimum
  if (intel.headerAnalysis?.replyToMismatch && intel.rdap.riskLevel === 'HIGH') {
    finalScore = Math.max(finalScore, 65)
  }

  // Risky attachment (HIGH type) from non-trusted sender → MEDIUM minimum
  if (intel.headerAnalysis?.attachmentRiskLevel === 'HIGH' && !intel.trustHint) {
    finalScore = Math.max(finalScore, 55)
  }

  // ── Trust cap — allowlisted domain ceiling ─────────────────────────────
  // freeProvider: gmail.com/yahoo.com senders DON'T get the trust cap
  // (an attacker can send from gmail.com and should score normally)
  if (intel.trustHint && !anyThreatHit && !intel.freeProvider) {
    // Only apply cap if no header-level impersonation either
    const hasHeaderFlags = intel.headerAnalysis?.displayNameMismatch ||
      intel.headerAnalysis?.replyToMismatch ||
      intel.domainSimilarity?.isLookalike
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

/**
 * Hybrid scoring engine — anchors Mercury-2's score with deterministic rule signals.
 * Formula: final = rule_score * 0.35 + mercury_score * 0.65
 *
 * Hard overrides always win regardless of formula result:
 * - VirusTotal hit → minimum 85
 * - Safe Browsing hit → minimum 85
 * - SPF fail + newly-registered domain → minimum 70
 * - Trusted allowlisted domain (no VT/SB) → maximum 40 (can't score HIGH without hard evidence)
 */

import type { AnalysisIntel, AnalysisReport } from './types'

/**
 * Calculate the deterministic rule-based pre-score from intel signals.
 * This score anchors the LLM to prevent drift from run to run.
 */
export function calcRuleScore(intel: AnalysisIntel): number {
  let score = 0

  // ── Sender Authentication ─────────────────────────────────────────────────
  if (intel.dns.spf === 'fail') score += 20
  else if (intel.dns.spf === 'none') score += 10
  // neutral = ~all or +all = slight risk but not alarming
  else if (intel.dns.spf === 'neutral') score += 5

  // DKIM: only penalize 'absent' (explicitly not configured) — 'unknown' is neutral
  if (intel.dns.dkim === 'absent') score += 10

  // DMARC
  if (intel.dns.dmarc.policy === 'none') score += 5
  else if (intel.dns.dmarc.policy === 'error') score += 3

  // ── Domain Intelligence ───────────────────────────────────────────────────
  if (intel.rdap.riskLevel === 'HIGH') score += 25    // < 30 days old
  else if (intel.rdap.riskLevel === 'MEDIUM') score += 12  // 30–90 days old

  // ── URL Threat Intelligence ───────────────────────────────────────────────
  if (intel.vt.flagged) score += 40
  if (intel.sb.flagged) score += 40
  if (intel.phishtank?.flagged) score += 35
  if (intel.urlhaus?.flagged) score += 35

  // Trust allowlist reduces rule score — known good senders get benefit of doubt
  if (intel.trustHint) score = Math.max(0, score - 15)

  return Math.min(100, score)
}

/**
 * Apply hybrid formula and hard overrides to produce the final anchored score.
 * Modifies the report in-place and returns it.
 */
export function applyHybridScore(
  report: Omit<AnalysisReport, 'duration_ms'>,
  intel: AnalysisIntel
): Omit<AnalysisReport, 'duration_ms'> {
  const mercuryScore = report.risk_score
  const ruleScore = calcRuleScore(intel)

  // Hybrid blend
  let finalScore = Math.round(ruleScore * 0.35 + mercuryScore * 0.65)

  // ── Hard overrides ────────────────────────────────────────────────────────
  if (intel.vt.flagged || intel.sb.flagged || intel.phishtank?.flagged || intel.urlhaus?.flagged) {
    finalScore = Math.max(finalScore, 85)
  }

  // SPF fail + newly registered domain = strong phishing combo
  if (intel.dns.spf === 'fail' && intel.rdap.riskLevel === 'HIGH') {
    finalScore = Math.max(finalScore, 70)
  }

  // Trusted allowlisted domain with no threat intel hits → cap at 40
  // (prevents hallucinated HIGH scores for Google/bank emails)
  const anyThreatHit = intel.vt.flagged || intel.sb.flagged || intel.phishtank?.flagged || intel.urlhaus?.flagged
  if (intel.trustHint && !anyThreatHit) {
    finalScore = Math.min(finalScore, 40)
  }

  finalScore = Math.max(0, Math.min(100, finalScore))

  return {
    ...report,
    risk_score: finalScore,
    risk_level: scoreToLevel(finalScore),
  }
}

function scoreToLevel(score: number): AnalysisReport['risk_level'] {
  if (score <= 10) return 'SAFE'
  if (score <= 25) return 'SAFE'
  if (score <= 49) return 'LOW'
  if (score <= 69) return 'MEDIUM'
  if (score <= 84) return 'HIGH'
  return 'CRITICAL'
}

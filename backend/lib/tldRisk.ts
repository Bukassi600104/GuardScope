/**
 * TLD Risk Assessment — Deterministic, no API required.
 *
 * Certain top-level domains have dramatically higher phishing rates.
 * Research from Spamhaus, APWG, and SURBL shows:
 *   - .xyz: 10x more phishing than .com
 *   - .top: most abused TLD in 2023-2024
 *   - Freenom TLDs (.tk, .ml, .ga, .cf, .gq): free registration = massively abused
 *   - .click, .link, .live: high abuse rates
 *
 * This check is cheap (no network), instant, and highly reliable as a SIGNAL
 * (not conclusive on its own — combined with other signals it's powerful).
 */

import type { TldRiskResult } from './types'

// TLDs with very high phishing/spam rates (data from APWG, Spamhaus, SURBL)
const HIGH_RISK_TLDS = new Set([
  'xyz', 'top', 'click', 'link', 'club', 'online', 'site', 'website',
  'live', 'support', 'help', 'cam', 'bid', 'trade', 'review', 'country',
  'stream', 'download', 'racing', 'cricket', 'party', 'win', 'faith',
  'date', 'men', 'loan', 'accountant', 'science', 'work',
  'space', 'website', 'press', 'host', 'buzz',
])

// Freenom "free" TLDs — historically the most abused for phishing due to zero cost
const FREE_REGISTRATION_TLDS = new Set([
  'tk', 'ml', 'ga', 'cf', 'gq',
])

/**
 * Assess the TLD risk level of a domain.
 */
export function assessTldRisk(domain: string): TldRiskResult {
  if (!domain) return { tld: '', isHighRisk: false, isFreeRegistration: false }

  const parts = domain.toLowerCase().split('.')
  const tld = parts[parts.length - 1] ?? ''

  return {
    tld,
    isHighRisk: HIGH_RISK_TLDS.has(tld) || FREE_REGISTRATION_TLDS.has(tld),
    isFreeRegistration: FREE_REGISTRATION_TLDS.has(tld),
  }
}

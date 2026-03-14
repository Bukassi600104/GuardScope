/**
 * Disposable Email Detection — deterministic, zero external dependency.
 *
 * Uses the community-maintained `disposable-email-domains` npm package (MIT license).
 * Package: https://github.com/ivolo/disposable-email-domains
 * Size: 121,000+ known disposable/temporary email service domains.
 *
 * Why NOT emailrep.io: their free tier is non-commercial only. GuardScope is a
 * commercial product. This deterministic npm-based approach has no ToS constraints.
 *
 * Note: The EmailRepResult interface is preserved so the rest of the codebase
 * (scorer.ts, route.ts) works unchanged. suspicious/blacklisted/maliciousActivity
 * always return false here — those signals come from SpamHaus and threat intel.
 */

import type { EmailRepResult } from './types'
// MIT-licensed list of 121,000+ disposable/temporary email service domains.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const disposableDomainList: string[] = require('disposable-email-domains') as string[]
// Wildcard base domains — any subdomain of these is also disposable
// eslint-disable-next-line @typescript-eslint/no-require-imports
const wildcardDomainList: string[] = require('disposable-email-domains/wildcard.json') as string[]

// Build a Set for O(1) lookups at runtime
const DISPOSABLE_DOMAINS = new Set(disposableDomainList)
// Sorted longest-first so we match the most specific base domain first
const WILDCARD_BASES = wildcardDomainList.sort((a, b) => b.length - a.length)

// Heuristic patterns that strongly suggest disposable/throwaway email services
// even if the domain isn't in the list above (catches brand-new services)
const DISPOSABLE_KEYWORDS = [
  'tempmail', 'throwaway', 'trashmail', 'spammail', 'fakemail',
  'disposable', 'mailinator', 'guerrilla', 'yopmail', 'nomail',
  'nospam', 'dumpmail', 'trashemail', 'spamgourmet', 'mailnull',
  'discard', 'mailtemp', 'tempinbox', 'mailbucket',
]

/**
 * Check if an email address uses a known disposable email service.
 * Returns synchronously — no network call, no ToS concerns.
 *
 * Two-pronged approach:
 * 1. Package domain list (121K+ known services, MIT license)
 * 2. Heuristic pattern matching (keyword-based for new services)
 */
export function emailRepCheck(email: string): EmailRepResult {
  if (!email) {
    return { suspicious: false, blacklisted: false, disposable: false, maliciousActivity: false, spoofing: false }
  }

  const domain = email.toLowerCase().split('@')[1] ?? ''

  // Check 1: npm package domain list (121K+ entries)
  const inList = DISPOSABLE_DOMAINS.has(domain)

  // Check 2: wildcard subdomain check — subdomain of a known disposable base
  const isSubdomain = !inList && WILDCARD_BASES.some(base => domain.endsWith(`.${base}`))

  // Check 3: heuristic keyword matching on the domain name
  const domainBase = domain.split('.')[0] ?? ''
  const heuristic = DISPOSABLE_KEYWORDS.some(kw => domainBase.includes(kw))

  const disposable = inList || isSubdomain || heuristic

  return {
    suspicious: disposable,
    blacklisted: false,       // covered by SpamHaus DBL + VirusTotal + SB
    disposable,
    maliciousActivity: false, // covered by SpamHaus DBL + OTX
    spoofing: false,          // covered by Return-Path mismatch + display name checks
  }
}

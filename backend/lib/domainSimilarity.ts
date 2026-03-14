/**
 * GuardScope Domain Similarity Module
 *
 * Detects lookalike domains used in phishing attacks:
 *   1. Typosquatting — levenshtein distance ≤ 1-2 from known brand domains
 *   2. Homograph / IDN attacks — Unicode look-alike characters (Cyrillic а vs Latin a)
 *   3. Combo squatting — brand name embedded with extra text ("paypal-secure.com")
 *   4. Subdomain impersonation — brand domain used as subdomain ("paypal.com.evil.com")
 *
 * Industry reference: JPCERT, Google Safe Browsing IDN protection, ProofPoint TAP
 */

import type { DomainSimilarityResult } from './types'

// ── Brand domain list ─────────────────────────────────────────────────────────
// World-class global coverage: 80+ brands, country-agnostic
const BRAND_DOMAINS: Array<{ brand: string; registrable: string[] }> = [
  // ── Global Tech & Payments ─────────────────────────────────────────────────
  { brand: 'PayPal',          registrable: ['paypal.com'] },
  { brand: 'Google',          registrable: ['google.com', 'gmail.com', 'googlemail.com'] },
  { brand: 'YouTube',         registrable: ['youtube.com', 'youtu.be', 'youtubemail.com'] },
  { brand: 'Apple',           registrable: ['apple.com', 'icloud.com'] },
  { brand: 'Microsoft',       registrable: ['microsoft.com', 'outlook.com', 'live.com', 'hotmail.com'] },
  { brand: 'Amazon',          registrable: ['amazon.com', 'amazon.co.uk', 'amazon.com.au', 'amazon.de'] },
  { brand: 'Netflix',         registrable: ['netflix.com'] },
  { brand: 'Facebook',        registrable: ['facebook.com', 'fb.com', 'meta.com'] },
  { brand: 'Instagram',       registrable: ['instagram.com'] },
  { brand: 'LinkedIn',        registrable: ['linkedin.com'] },
  { brand: 'Twitter',         registrable: ['twitter.com', 'x.com'] },
  { brand: 'Dropbox',         registrable: ['dropbox.com'] },
  { brand: 'Stripe',          registrable: ['stripe.com'] },
  { brand: 'Shopify',         registrable: ['shopify.com'] },
  { brand: 'GitHub',          registrable: ['github.com'] },
  { brand: 'Adobe',           registrable: ['adobe.com'] },
  { brand: 'Salesforce',      registrable: ['salesforce.com'] },
  { brand: 'Zoom',            registrable: ['zoom.us', 'zoom.com'] },
  { brand: 'DocuSign',        registrable: ['docusign.com'] },
  { brand: 'Spotify',         registrable: ['spotify.com'] },
  { brand: 'Discord',         registrable: ['discord.com', 'discord.gg'] },
  { brand: 'Twitch',          registrable: ['twitch.tv'] },
  { brand: 'Reddit',          registrable: ['reddit.com'] },
  { brand: 'TikTok',          registrable: ['tiktok.com'] },
  { brand: 'WhatsApp',        registrable: ['whatsapp.com'] },
  { brand: 'Telegram',        registrable: ['telegram.org'] },
  // ── Payments & Fintech ────────────────────────────────────────────────────
  { brand: 'Venmo',           registrable: ['venmo.com'] },
  { brand: 'CashApp',         registrable: ['cash.app'] },
  { brand: 'Zelle',           registrable: ['zellepay.com'] },
  { brand: 'Wise',            registrable: ['wise.com', 'transferwise.com'] },
  { brand: 'Revolut',         registrable: ['revolut.com'] },
  { brand: 'Monzo',           registrable: ['monzo.com'] },
  { brand: 'Klarna',          registrable: ['klarna.com'] },
  { brand: 'Western Union',   registrable: ['westernunion.com'] },
  { brand: 'Skrill',          registrable: ['skrill.com'] },
  // ── Crypto ───────────────────────────────────────────────────────────────
  { brand: 'Binance',         registrable: ['binance.com'] },
  { brand: 'Coinbase',        registrable: ['coinbase.com'] },
  { brand: 'Kraken',          registrable: ['kraken.com'] },
  { brand: 'Bybit',           registrable: ['bybit.com'] },
  { brand: 'OKX',             registrable: ['okx.com'] },
  { brand: 'KuCoin',          registrable: ['kucoin.com'] },
  { brand: 'Crypto.com',      registrable: ['crypto.com'] },
  { brand: 'MetaMask',        registrable: ['metamask.io'] },
  // ── US / North American Banks ────────────────────────────────────────────
  { brand: 'Bank of America', registrable: ['bankofamerica.com'] },
  { brand: 'Chase',           registrable: ['chase.com', 'jpmorgan.com'] },
  { brand: 'Wells Fargo',     registrable: ['wellsfargo.com'] },
  { brand: 'Citibank',        registrable: ['citibank.com', 'citi.com'] },
  { brand: 'Capital One',     registrable: ['capitalone.com'] },
  { brand: 'US Bank',         registrable: ['usbank.com'] },
  { brand: 'TD Bank',         registrable: ['td.com', 'tdbank.com'] },
  { brand: 'RBC',             registrable: ['rbc.com'] },
  { brand: 'Scotiabank',      registrable: ['scotiabank.com'] },
  // ── UK / European Banks ──────────────────────────────────────────────────
  { brand: 'HSBC',            registrable: ['hsbc.com', 'hsbc.co.uk'] },
  { brand: 'Barclays',        registrable: ['barclays.com', 'barclays.co.uk'] },
  { brand: 'Lloyds',          registrable: ['lloydsbank.com'] },
  { brand: 'NatWest',         registrable: ['natwest.com'] },
  { brand: 'Santander',       registrable: ['santander.co.uk', 'santander.com'] },
  { brand: 'Halifax',         registrable: ['halifax.co.uk'] },
  { brand: 'Nationwide',      registrable: ['nationwide.co.uk'] },
  { brand: 'Standard Chartered', registrable: ['sc.com', 'standardchartered.com'] },
  { brand: 'ING',             registrable: ['ing.com', 'ing.nl'] },
  // ── Delivery ─────────────────────────────────────────────────────────────
  { brand: 'DHL',             registrable: ['dhl.com'] },
  { brand: 'FedEx',           registrable: ['fedex.com'] },
  { brand: 'UPS',             registrable: ['ups.com'] },
  { brand: 'USPS',            registrable: ['usps.com'] },
  { brand: 'Royal Mail',      registrable: ['royalmail.com'] },
  { brand: 'Australia Post',  registrable: ['auspost.com.au'] },
  { brand: 'Canada Post',     registrable: ['canadapost.ca'] },
  // ── African Banks & Fintechs ─────────────────────────────────────────────
  { brand: 'GTBank',          registrable: ['gtbank.com', 'gtco.com'] },
  { brand: 'Zenith Bank',     registrable: ['zenithbank.com'] },
  { brand: 'Access Bank',     registrable: ['accessbankplc.com', 'accessbank.com'] },
  { brand: 'First Bank',      registrable: ['firstbanknigeria.com'] },
  { brand: 'UBA',             registrable: ['uba.com', 'ubagroup.com'] },
  { brand: 'Kuda',            registrable: ['kuda.com'] },
  { brand: 'OPay',            registrable: ['opayweb.com'] },
  { brand: 'PalmPay',         registrable: ['palmpay.com'] },
  { brand: 'PiggyVest',       registrable: ['piggyvest.com'] },
  { brand: 'Flutterwave',     registrable: ['flutterwave.com'] },
  { brand: 'Paystack',        registrable: ['paystack.com'] },
  { brand: 'Moniepoint',      registrable: ['moniepoint.com'] },
  { brand: 'Ecobank',         registrable: ['ecobank.com'] },
  { brand: 'MTN',             registrable: ['mtnonline.com', 'mtn.com'] },
  { brand: 'Safaricom',       registrable: ['safaricom.co.ke'] },
  { brand: 'Equity Bank',     registrable: ['equitybankgroup.com'] },
  { brand: 'CBN',             registrable: ['cbn.gov.ng'] },
  { brand: 'EFCC',            registrable: ['efcc.gov.ng'] },
  // ── Government (Global) ──────────────────────────────────────────────────
  { brand: 'IRS',             registrable: ['irs.gov'] },
  { brand: 'HMRC',            registrable: ['hmrc.gov.uk'] },
  { brand: 'ATO',             registrable: ['ato.gov.au'] },
]

// ── Multi-part TLDs for correct eTLD+1 extraction ────────────────────────────
const MULTI_PART_TLDS = new Set([
  'co.uk', 'co.nz', 'co.za', 'co.jp', 'co.in', 'co.id', 'co.ke',
  'com.au', 'com.ng', 'com.br', 'com.ar', 'com.mx', 'com.co',
  'com.sg', 'com.ph', 'com.gh', 'com.pk', 'com.eg', 'com.tz',
  'gov.ng', 'gov.uk', 'gov.au', 'org.ng', 'net.ng', 'edu.ng',
  'ac.uk', 'ne.jp', 'or.jp',
])

// ── Unicode homograph character mappings ──────────────────────────────────────
// Maps visually similar non-ASCII characters to their ASCII equivalents.
// Extended list covering Cyrillic, Greek, and common digit/letter substitutions.
const HOMOGRAPH_SUBS: Array<[string, string]> = [
  // Cyrillic lookalikes
  ['а', 'a'], ['е', 'e'], ['о', 'o'], ['р', 'p'], ['с', 'c'], ['х', 'x'],
  ['і', 'i'], ['ѕ', 's'], ['ԁ', 'd'], ['ɡ', 'g'], ['ᴜ', 'u'], ['ⅼ', 'l'],
  // Greek lookalikes
  ['ο', 'o'], ['ρ', 'p'], ['α', 'a'], ['ν', 'n'], ['β', 'b'], ['κ', 'k'],
  ['ι', 'i'], ['υ', 'u'], ['τ', 't'], ['η', 'n'], ['ε', 'e'],
  // Digit substitutions
  ['0', 'o'], ['1', 'l'], ['3', 'e'], ['4', 'a'], ['5', 's'], ['7', 't'],
  // Multi-char substitutions
  ['rn', 'm'], ['vv', 'w'], ['li', 'li'], ['cl', 'd'], ['nn', 'm'],
]

// ── Utility functions ─────────────────────────────────────────────────────────

/**
 * Extract the registrable domain (eTLD+1) from a full domain.
 * e.g., "login.paypal.com" → "paypal.com", "mail.co.uk" → "mail.co.uk"
 */
export function extractRegistrableDomain(domain: string): string {
  const d = domain.toLowerCase().trim()
  const parts = d.split('.')
  if (parts.length <= 2) return d
  const lastTwo = parts.slice(-2).join('.')
  if (MULTI_PART_TLDS.has(lastTwo)) {
    return parts.length >= 3 ? parts.slice(-3).join('.') : d
  }
  return parts.slice(-2).join('.')
}

/**
 * Standard Levenshtein edit distance.
 * Used for typosquatting detection.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp: number[][] = []
  for (let i = 0; i <= m; i++) {
    dp[i] = [i]
    for (let j = 1; j <= n; j++) dp[i][j] = 0
  }
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    }
  }
  return dp[m][n]
}

function hasNonAsciiOrPunycode(domain: string): boolean {
  return /[^\x00-\x7F]/.test(domain) ||
    domain.startsWith('xn--') ||
    domain.includes('.xn--')
}

function normalizeHomograph(domain: string): string {
  let s = domain.toLowerCase()
  for (const [lookalike, ascii] of HOMOGRAPH_SUBS) {
    // Replace all occurrences, longest patterns first (already ordered above)
    s = s.split(lookalike).join(ascii)
  }
  return s
}

// ── Main analysis ─────────────────────────────────────────────────────────────

export function analyzeDomainSimilarity(domain: string): DomainSimilarityResult {
  const CLEAN: DomainSimilarityResult = {
    isLookalike: false, targetBrand: null, technique: null, confidence: 'LOW', detail: null
  }
  if (!domain) return CLEAN

  const fullDomain = domain.toLowerCase()
  const registrable = extractRegistrableDomain(fullDomain)

  // ── 1. Exact match check — it's the real domain, no issue ─────────────────
  for (const { registrable: brandDomains } of BRAND_DOMAINS) {
    if (brandDomains.includes(registrable)) return CLEAN
  }

  // ── 2. Subdomain impersonation: brand.com.attacker.com ────────────────────
  // The full domain CONTAINS a brand domain, but the registrable domain is different
  for (const { brand, registrable: brandDomains } of BRAND_DOMAINS) {
    for (const brandDomain of brandDomains) {
      if (fullDomain.includes(brandDomain) && registrable !== brandDomain) {
        return {
          isLookalike: true,
          targetBrand: brand,
          technique: 'subdomain_impersonation',
          confidence: 'HIGH',
          detail: `"${domain}" uses "${brandDomain}" as a subdomain — real brand domain is a subdomain of an attacker-controlled registrable domain`,
        }
      }
    }
  }

  // ── 3. Homograph / IDN attack ─────────────────────────────────────────────
  if (hasNonAsciiOrPunycode(fullDomain)) {
    const normalizedRegistrable = normalizeHomograph(registrable)
    for (const { brand, registrable: brandDomains } of BRAND_DOMAINS) {
      for (const brandDomain of brandDomains) {
        if (normalizedRegistrable === brandDomain) {
          return {
            isLookalike: true,
            targetBrand: brand,
            technique: 'homograph_idn',
            confidence: 'HIGH',
            detail: `"${domain}" uses visually identical Unicode characters to impersonate "${brandDomain}"`,
          }
        }
      }
    }
    // Even if we don't match a known brand, non-ASCII in domain is still suspicious — return partial flag
    return {
      isLookalike: true,
      targetBrand: null,
      technique: 'homograph_idn',
      confidence: 'MEDIUM',
      detail: `"${domain}" contains non-ASCII (internationalized) characters — potential homograph attack`,
    }
  }

  // ── 4. Typosquatting — levenshtein distance ≤ 1 or ≤ 2 ──────────────────
  const regBase = registrable.split('.')[0]  // e.g., "paypa1" from "paypa1.com"
  for (const { brand, registrable: brandDomains } of BRAND_DOMAINS) {
    for (const brandDomain of brandDomains) {
      const brandBase = brandDomain.split('.')[0]  // e.g., "paypal" from "paypal.com"

      // Quick rejection: skip if length difference is too large
      if (Math.abs(regBase.length - brandBase.length) > 3) continue

      const dist = levenshtein(regBase, brandBase)
      // Threshold: 1 edit for short domains (≤6 chars), 2 edits for longer
      const threshold = brandBase.length <= 6 ? 1 : 2

      if (dist > 0 && dist <= threshold) {
        return {
          isLookalike: true,
          targetBrand: brand,
          technique: 'typosquatting',
          confidence: dist === 1 ? 'HIGH' : 'MEDIUM',
          detail: `"${registrable}" is ${dist} character edit${dist > 1 ? 's' : ''} away from "${brandDomain}" — likely typosquatting`,
        }
      }
    }
  }

  // ── 5. Combo squatting — brandname + extra keyword ────────────────────────
  // e.g., "paypal-secure.com", "amazon-support.net", "paypal.verification-center.com"
  for (const { brand, registrable: brandDomains } of BRAND_DOMAINS) {
    for (const brandDomain of brandDomains) {
      const brandBase = brandDomain.split('.')[0]

      // Check if brand base name appears in the registrable domain as a component
      if (
        regBase !== brandBase &&
        regBase.length > brandBase.length + 1 &&
        (regBase.startsWith(brandBase) || regBase.endsWith(brandBase) || regBase.includes('-' + brandBase) || regBase.includes(brandBase + '-'))
      ) {
        return {
          isLookalike: true,
          targetBrand: brand,
          technique: 'combo_squatting',
          confidence: 'MEDIUM',
          detail: `"${registrable}" embeds the brand name "${brandBase}" with extra text — common combo squatting pattern`,
        }
      }
    }
  }

  return CLEAN
}

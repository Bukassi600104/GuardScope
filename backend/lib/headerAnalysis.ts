/**
 * GuardScope Header Analysis Module
 *
 * Deterministic analysis of email metadata signals that do not require AI:
 *   - Reply-To domain mismatch (attacker wants replies to go to their inbox)
 *   - Display name brand impersonation ("PayPal <attacker@gmail.com>")
 *   - Risky attachment classification (.exe, .vbs, .zip, macro-enabled Office, etc.)
 *   - IP address URLs (no legitimate org links to raw IPs)
 *   - Anchor text vs href mismatch (link text says "paypal.com" but href is evil.com)
 *   - data: / javascript: URI scheme detection
 *
 * Industry reference: ProofPoint, Mimecast, Barracuda, Microsoft Defender for Office 365
 */

import type { EmailInput, HeaderAnalysisResult } from './types'

// ── Brand list for display name impersonation detection ──────────────────────
// Covers major global + Nigerian brands most commonly impersonated in phishing
const BRAND_IMPERSONATION_LIST: Array<{ brand: string; officialDomains: string[] }> = [
  { brand: 'PayPal',          officialDomains: ['paypal.com'] },
  { brand: 'Apple',           officialDomains: ['apple.com', 'icloud.com', 'me.com'] },
  { brand: 'Google',          officialDomains: ['google.com', 'gmail.com', 'googlemail.com', 'accounts.google.com'] },
  { brand: 'Microsoft',       officialDomains: ['microsoft.com', 'outlook.com', 'hotmail.com', 'live.com', 'office.com', 'office365.com', 'microsoftonline.com'] },
  { brand: 'Amazon',          officialDomains: ['amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.com.ng', 'amazon.com.br', 'amazon.ca', 'amazon.com.au'] },
  { brand: 'Netflix',         officialDomains: ['netflix.com'] },
  { brand: 'Facebook',        officialDomains: ['facebook.com', 'fb.com', 'meta.com'] },
  { brand: 'Instagram',       officialDomains: ['instagram.com'] },
  { brand: 'LinkedIn',        officialDomains: ['linkedin.com'] },
  { brand: 'Twitter',         officialDomains: ['twitter.com', 'x.com'] },
  { brand: 'WhatsApp',        officialDomains: ['whatsapp.com'] },
  { brand: 'Dropbox',         officialDomains: ['dropbox.com'] },
  { brand: 'Stripe',          officialDomains: ['stripe.com'] },
  { brand: 'Shopify',         officialDomains: ['shopify.com'] },
  { brand: 'GitHub',          officialDomains: ['github.com'] },
  { brand: 'DHL',             officialDomains: ['dhl.com', 'dhl.de', 'dhl.co.uk'] },
  { brand: 'FedEx',           officialDomains: ['fedex.com'] },
  { brand: 'UPS',             officialDomains: ['ups.com'] },
  { brand: 'USPS',            officialDomains: ['usps.com'] },
  { brand: 'Bank of America', officialDomains: ['bankofamerica.com'] },
  { brand: 'Chase',           officialDomains: ['chase.com', 'jpmorgan.com', 'jpmorganchase.com'] },
  { brand: 'Wells Fargo',     officialDomains: ['wellsfargo.com'] },
  { brand: 'Citibank',        officialDomains: ['citibank.com', 'citi.com'] },
  { brand: 'HSBC',            officialDomains: ['hsbc.com', 'hsbc.co.uk'] },
  { brand: 'Binance',         officialDomains: ['binance.com'] },
  { brand: 'Coinbase',        officialDomains: ['coinbase.com'] },
  // Nigerian banks
  { brand: 'GTBank',          officialDomains: ['gtbank.com', 'guarantytrustbank.com', 'gtco.com'] },
  { brand: 'Zenith Bank',     officialDomains: ['zenithbank.com'] },
  { brand: 'Access Bank',     officialDomains: ['accessbankplc.com', 'accessbank.com'] },
  { brand: 'First Bank',      officialDomains: ['firstbanknigeria.com', 'firstbank.com.ng'] },
  { brand: 'UBA',             officialDomains: ['uba.com', 'ubagroup.com'] },
  { brand: 'FCMB',            officialDomains: ['fcmb.com'] },
  { brand: 'Stanbic IBTC',    officialDomains: ['stanbicibtcbank.com', 'stanbicibplc.com'] },
  { brand: 'Fidelity Bank',   officialDomains: ['fidelitybank.ng'] },
  { brand: 'Union Bank',      officialDomains: ['unionbankng.com'] },
  { brand: 'Keystone Bank',   officialDomains: ['keystonebankng.com'] },
  { brand: 'Sterling Bank',   officialDomains: ['sterlingbank.com'] },
  { brand: 'Kuda',            officialDomains: ['kuda.com'] },
  { brand: 'OPay',            officialDomains: ['opayweb.com', 'opay.ng'] },
  { brand: 'PalmPay',         officialDomains: ['palmpay.com'] },
  { brand: 'PiggyVest',       officialDomains: ['piggyvest.com'] },
  { brand: 'Cowrywise',       officialDomains: ['cowrywise.com'] },
  { brand: 'Flutterwave',     officialDomains: ['flutterwave.com'] },
  { brand: 'Paystack',        officialDomains: ['paystack.com'] },
  { brand: 'Moniepoint',      officialDomains: ['moniepoint.com', 'teamapt.com'] },
  { brand: 'MTN',             officialDomains: ['mtn.com', 'mtnonline.com'] },
  { brand: 'Airtel',          officialDomains: ['airtel.com.ng', 'airtel.com'] },
  { brand: 'Glo',             officialDomains: ['gloworld.com', 'glo.ng'] },
  { brand: '9mobile',         officialDomains: ['9mobile.com.ng'] },
  // Nigerian government
  { brand: 'CBN',             officialDomains: ['cbn.gov.ng'] },
  { brand: 'EFCC',            officialDomains: ['efcc.gov.ng'] },
  { brand: 'FIRS',            officialDomains: ['firs.gov.ng'] },
  { brand: 'NAFDAC',          officialDomains: ['nafdac.gov.ng'] },
  { brand: 'NNPC',            officialDomains: ['nnpc.gov.ng', 'nnpcgroup.com'] },
  { brand: 'Nigerian Government', officialDomains: ['gov.ng'] },
]

// ── Attachment risk classification ───────────────────────────────────────────
// HIGH: executables, scripts, shell commands — direct malware delivery
const HIGH_RISK_EXTENSIONS = new Set([
  'exe', 'msi', 'bat', 'cmd', 'com', 'vbs', 'vbe', 'js', 'jse',
  'wsf', 'wsh', 'ps1', 'ps2', 'psc1', 'psc2', 'reg', 'scr',
  'hta', 'cpl', 'jar', 'app', 'dmg', 'deb', 'rpm', 'sh', 'bash',
  'lnk',  // Windows shortcut — commonly weaponized
])

// MEDIUM: archives (often contain malware), macro-enabled Office docs
const MEDIUM_RISK_EXTENSIONS = new Set([
  'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso', 'img',
  'docm', 'xlsm', 'pptm', 'dotm', 'xlam', 'xltm', 'xlsb',
  'accdb', 'mdb',  // Access databases — can run code
])

// ── Helper utilities ──────────────────────────────────────────────────────────

function extractEmailDomain(emailOrDomain: string | null): string | null {
  if (!emailOrDomain) return null
  const atMatch = emailOrDomain.match(/@([\w.-]+\.[a-z]{2,})/)
  if (atMatch) return atMatch[1].toLowerCase()
  // Might already be a domain
  if (/^[\w.-]+\.[a-z]{2,}$/.test(emailOrDomain)) return emailOrDomain.toLowerCase()
  return null
}

function extractUrlDomain(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

function isIpAddressUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true   // IPv4
    if (host.startsWith('[') && host.includes(':')) return true  // IPv6
    return false
  } catch {
    return false
  }
}

function domainsMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false
  if (a === b) return true
  // Allow subdomain relationships: mail.paypal.com and paypal.com are the same brand
  if (a.endsWith('.' + b) || b.endsWith('.' + a)) return true
  return false
}

// ── Brand impersonation detection ────────────────────────────────────────────

function detectDisplayNameBrand(
  fromName: string | null,
  fromDomain: string | null
): { brand: string | null; mismatch: boolean } {
  if (!fromName) return { brand: null, mismatch: false }
  const nameLower = fromName.toLowerCase().trim()

  for (const { brand, officialDomains } of BRAND_IMPERSONATION_LIST) {
    const brandLower = brand.toLowerCase()
    // Check if display name contains the brand name (word boundary check)
    const brandRegex = new RegExp(`\\b${brandLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
    if (!brandRegex.test(nameLower)) continue

    // Check if fromEmail domain is one of the brand's official domains
    const isOfficialDomain = fromDomain != null && officialDomains.some(
      d => fromDomain === d || fromDomain.endsWith('.' + d)
    )

    return { brand, mismatch: !isOfficialDomain }
  }
  return { brand: null, mismatch: false }
}

// ── Main analysis function ────────────────────────────────────────────────────

export function analyzeHeaders(email: EmailInput): HeaderAnalysisResult {
  const fromDomain = extractEmailDomain(email.fromEmail)
  const replyToDomain = extractEmailDomain(email.replyTo)

  // Reply-To mismatch: replyTo exists AND its domain differs from sender domain
  // Skip if replyTo is a parent/subdomain of fromDomain (valid patterns like mail.corp.com → corp.com)
  const replyToMismatch = !!(
    replyToDomain &&
    fromDomain &&
    !domainsMatch(replyToDomain, fromDomain)
  )

  // Display name brand impersonation
  const { brand: displayNameBrand, mismatch: displayNameMismatch } =
    detectDisplayNameBrand(email.fromName, fromDomain)

  // ── Attachment risk ────────────────────────────────────────────────────────
  const riskyAttachments: string[] = []
  let attachmentRiskLevel: HeaderAnalysisResult['attachmentRiskLevel'] = 'NONE'

  for (const att of email.attachments) {
    const attName = att.name ?? ''
    const ext = (att.extension ?? attName.split('.').pop() ?? '').toLowerCase()
    if (HIGH_RISK_EXTENSIONS.has(ext)) {
      riskyAttachments.push(attName)
      attachmentRiskLevel = 'HIGH'
    } else if (MEDIUM_RISK_EXTENSIONS.has(ext) && attachmentRiskLevel !== 'HIGH') {
      riskyAttachments.push(attName)
      attachmentRiskLevel = 'MEDIUM'
    }
  }

  // ── URL analysis ──────────────────────────────────────────────────────────
  const ipAddressUrls: string[] = []
  let hasDataUri = false
  let hasJavascriptUri = false

  for (const url of email.urls) {
    if (url.startsWith('data:'))        { hasDataUri = true; continue }
    if (url.startsWith('javascript:'))  { hasJavascriptUri = true; continue }
    if (isIpAddressUrl(url))            { ipAddressUrls.push(url) }
  }

  // ── Anchor text vs href mismatch ──────────────────────────────────────────
  // Detect when visible link text looks like a legitimate domain but href goes elsewhere
  const anchorTextMismatches: HeaderAnalysisResult['anchorTextMismatches'] = []

  if (email.anchorLinks) {
    for (const { text, href } of email.anchorLinks) {
      const textTrimmed = text.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
      const hrefDomain = extractUrlDomain(href)

      // Only flag when text looks like a domain (contains a dot and a TLD)
      if (!/^[\w.-]+\.[a-z]{2,}/.test(textTrimmed) || !hrefDomain) continue

      // If text domain and href domain differ (not a subdomain relationship)
      if (!domainsMatch(textTrimmed, hrefDomain)) {
        anchorTextMismatches.push({
          text: text.trim().slice(0, 80),
          href: href.slice(0, 120),
          textDomain: textTrimmed,
          hrefDomain,
        })
      }
    }
  }

  return {
    replyToMismatch,
    replyToDomain,
    displayNameBrand,
    displayNameMismatch,
    attachmentRiskLevel,
    riskyAttachments,
    ipAddressUrls,
    urlCount: email.urls.length,
    hasDataUri,
    hasJavascriptUri,
    anchorTextMismatches,
  }
}

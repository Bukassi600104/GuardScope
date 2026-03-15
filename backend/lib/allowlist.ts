/**
 * Trusted domain allowlist — domains with established reputation.
 * Used to fast-track analysis and reduce false positives for known-good senders.
 *
 * Note: inclusion here does NOT bypass threat intel (VT/SB still run).
 * It only informs Mercury that these are known-legitimate domains.
 */

// Tier-1 global technology + financial platforms
const GLOBAL_TRUSTED = new Set([
  // GuardScope own domain — transactional auth emails (password reset, confirmation)
  'guardscope.app',

  'google.com', 'gmail.com', 'googlemail.com', 'accounts.google.com',
  'microsoft.com', 'outlook.com', 'hotmail.com', 'live.com', 'office.com', 'microsoft365.com',
  'apple.com', 'icloud.com',
  'amazon.com', 'aws.amazon.com', 'amazonses.com',
  'paypal.com', 'paypal.me',
  'meta.com', 'facebook.com', 'instagram.com', 'whatsapp.com',
  'linkedin.com',
  'github.com', 'githubusercontent.com',
  'twitter.com', 'x.com',
  'stripe.com',
  'zoom.us', 'zoomgov.com',
  'slack.com',
  'dropbox.com',
  'netflix.com',
  'spotify.com',
  'adobe.com',
  'salesforce.com',
  'hubspot.com',
  'mailchimp.com', 'mandrill.com',
  'sendgrid.net', 'sendgrid.com',
  'twilio.com',
  'shopify.com',
])

// Nigerian banks (major commercial banks)
const NIGERIA_BANKS = new Set([
  'gtbank.com', 'gtco.com',
  'accessbank.com', 'accessbankplc.com',
  'zenithbank.com',
  'firstbanknigeria.com', 'firstbankng.com',
  'uba.com', 'ubagroup.com',
  'stanbicibtc.com',
  'fidelitybank.ng', 'fidelitybankng.com',
  'unionbankng.com',
  'keystonebankng.com',
  'ecobank.com',
  'polaris.bank',
  'wemabank.com',
  'sterlingbank.com',
  'fcmb.com',
  'citibank.com.ng',
  'coronationmb.com',
  'jaizbank.com',
  'providusbank.com',
  'titantrustbank.com',
  'optimusbank.com',
  'palmpay.com',
  'opay.ng', 'opay.com', 'opay-nigeria.com',
  'kuda.com',
  'moniepoint.com',
  'piggyvest.com',
  'cowrywise.com',
  'carbon.ng',
])

// Nigerian government + telcos
const NIGERIA_GOV_TELCO = new Set([
  'gov.ng',
  'firs.gov.ng',
  'nnpc.com.ng', 'nnpcgroup.com',
  'cbn.gov.ng',
  'sec.gov.ng',
  'efcc.gov.ng',
  'nafdac.gov.ng',
  'ncc.gov.ng',
  'mtn.com.ng', 'mtnonline.com',
  'airtel.com.ng',
  'glo.com.ng', 'gloworld.com',
  '9mobile.com.ng',
])

/**
 * Returns true if the domain (or any parent domain) is in the allowlist.
 * e.g. "mail.google.com" matches "google.com"
 */
export function isTrustedDomain(domain: string): boolean {
  if (!domain) return false
  const d = domain.toLowerCase().trim()

  // Direct match
  if (GLOBAL_TRUSTED.has(d) || NIGERIA_BANKS.has(d) || NIGERIA_GOV_TELCO.has(d)) return true

  // Parent domain match (e.g. "accounts.google.com" → check "google.com")
  const parts = d.split('.')
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join('.')
    if (GLOBAL_TRUSTED.has(parent) || NIGERIA_BANKS.has(parent) || NIGERIA_GOV_TELCO.has(parent)) {
      return true
    }
  }

  // Gov.ng TLD catch-all
  if (d.endsWith('.gov.ng')) return true

  return false
}

/**
 * Returns the category of the trusted domain for Mercury's context.
 */
export function getTrustCategory(domain: string): 'global_tech' | 'financial_institution' | 'government_telecom' | null {
  if (!domain) return null
  const d = domain.toLowerCase().trim()

  const checkSet = (set: Set<string>) => {
    if (set.has(d)) return true
    const parts = d.split('.')
    for (let i = 1; i < parts.length - 1; i++) {
      if (set.has(parts.slice(i).join('.'))) return true
    }
    return false
  }

  if (checkSet(GLOBAL_TRUSTED)) return 'global_tech'
  if (checkSet(NIGERIA_BANKS)) return 'financial_institution'
  if (checkSet(NIGERIA_GOV_TELCO) || d.endsWith('.gov.ng')) return 'government_telecom'
  return null
}

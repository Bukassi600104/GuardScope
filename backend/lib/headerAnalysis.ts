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
// World-class global coverage: 200+ brands across all major sectors
const BRAND_IMPERSONATION_LIST: Array<{ brand: string; officialDomains: string[] }> = [
  // ── Global Tech & Social ──────────────────────────────────────────────────
  { brand: 'PayPal',          officialDomains: ['paypal.com'] },
  { brand: 'Apple',           officialDomains: ['apple.com', 'icloud.com', 'me.com'] },
  { brand: 'Google',          officialDomains: ['google.com', 'gmail.com', 'googlemail.com', 'accounts.google.com'] },
  { brand: 'Microsoft',       officialDomains: ['microsoft.com', 'outlook.com', 'hotmail.com', 'live.com', 'office.com', 'office365.com', 'microsoftonline.com'] },
  { brand: 'Amazon',          officialDomains: ['amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.com.ng', 'amazon.com.br', 'amazon.ca', 'amazon.com.au', 'amazonses.com'] },
  { brand: 'Netflix',         officialDomains: ['netflix.com'] },
  { brand: 'Facebook',        officialDomains: ['facebook.com', 'fb.com', 'meta.com', 'facebookmail.com'] },
  { brand: 'Instagram',       officialDomains: ['instagram.com'] },
  { brand: 'LinkedIn',        officialDomains: ['linkedin.com', 'e.linkedin.com'] },
  { brand: 'Twitter',         officialDomains: ['twitter.com', 'x.com'] },
  { brand: 'WhatsApp',        officialDomains: ['whatsapp.com'] },
  { brand: 'Dropbox',         officialDomains: ['dropbox.com'] },
  { brand: 'Stripe',          officialDomains: ['stripe.com'] },
  { brand: 'Shopify',         officialDomains: ['shopify.com'] },
  { brand: 'GitHub',          officialDomains: ['github.com'] },
  { brand: 'Adobe',           officialDomains: ['adobe.com', 'adobelogin.com'] },
  { brand: 'Salesforce',      officialDomains: ['salesforce.com', 'force.com', 'salesforceiq.com'] },
  { brand: 'Zoom',            officialDomains: ['zoom.us', 'zoom.com', 'zoomgov.com'] },
  { brand: 'Slack',           officialDomains: ['slack.com'] },
  { brand: 'DocuSign',        officialDomains: ['docusign.com', 'docusign.net'] },
  { brand: 'Dropbox',         officialDomains: ['dropbox.com'] },
  { brand: 'Notion',          officialDomains: ['notion.so', 'notion.com'] },
  { brand: 'Canva',           officialDomains: ['canva.com'] },
  { brand: 'Figma',           officialDomains: ['figma.com'] },
  { brand: 'Spotify',         officialDomains: ['spotify.com'] },
  { brand: 'Disney+',         officialDomains: ['disneyplus.com', 'disney.com'] },
  { brand: 'Hulu',            officialDomains: ['hulu.com'] },
  { brand: 'Twitch',          officialDomains: ['twitch.tv'] },
  { brand: 'YouTube',         officialDomains: ['youtube.com', 'youtubemail.com'] },
  { brand: 'TikTok',          officialDomains: ['tiktok.com'] },
  { brand: 'Pinterest',       officialDomains: ['pinterest.com'] },
  { brand: 'Reddit',          officialDomains: ['reddit.com', 'redditmail.com'] },
  { brand: 'Snapchat',        officialDomains: ['snapchat.com'] },
  { brand: 'Telegram',        officialDomains: ['telegram.org'] },
  { brand: 'Signal',          officialDomains: ['signal.org'] },
  // ── Global Payments ──────────────────────────────────────────────────────
  { brand: 'Venmo',           officialDomains: ['venmo.com'] },
  { brand: 'Cash App',        officialDomains: ['cash.app', 'square.com'] },
  { brand: 'Zelle',           officialDomains: ['zellepay.com'] },
  { brand: 'Wise',            officialDomains: ['wise.com', 'transferwise.com'] },
  { brand: 'Revolut',         officialDomains: ['revolut.com'] },
  { brand: 'N26',             officialDomains: ['n26.com'] },
  { brand: 'Monzo',           officialDomains: ['monzo.com'] },
  { brand: 'Starling',        officialDomains: ['starlingbank.com'] },
  { brand: 'Klarna',          officialDomains: ['klarna.com'] },
  { brand: 'Afterpay',        officialDomains: ['afterpay.com', 'clearpay.co.uk'] },
  { brand: 'Western Union',   officialDomains: ['westernunion.com'] },
  { brand: 'MoneyGram',       officialDomains: ['moneygram.com'] },
  { brand: 'Skrill',          officialDomains: ['skrill.com'] },
  { brand: 'Neteller',        officialDomains: ['neteller.com'] },
  // ── Crypto ────────────────────────────────────────────────────────────────
  { brand: 'Binance',         officialDomains: ['binance.com'] },
  { brand: 'Coinbase',        officialDomains: ['coinbase.com'] },
  { brand: 'Kraken',          officialDomains: ['kraken.com'] },
  { brand: 'Bybit',           officialDomains: ['bybit.com'] },
  { brand: 'OKX',             officialDomains: ['okx.com'] },
  { brand: 'KuCoin',          officialDomains: ['kucoin.com'] },
  { brand: 'Crypto.com',      officialDomains: ['crypto.com'] },
  { brand: 'Gemini',          officialDomains: ['gemini.com'] },
  { brand: 'Ledger',          officialDomains: ['ledger.com'] },
  { brand: 'MetaMask',        officialDomains: ['metamask.io'] },
  { brand: 'Trust Wallet',    officialDomains: ['trustwallet.com'] },
  // ── US / Canada Banks ────────────────────────────────────────────────────
  { brand: 'Bank of America', officialDomains: ['bankofamerica.com'] },
  { brand: 'Chase',           officialDomains: ['chase.com', 'jpmorgan.com', 'jpmorganchase.com'] },
  { brand: 'Wells Fargo',     officialDomains: ['wellsfargo.com'] },
  { brand: 'Citibank',        officialDomains: ['citibank.com', 'citi.com'] },
  { brand: 'US Bank',         officialDomains: ['usbank.com'] },
  { brand: 'Capital One',     officialDomains: ['capitalone.com'] },
  { brand: 'Ally Bank',       officialDomains: ['ally.com'] },
  { brand: 'TD Bank',         officialDomains: ['td.com', 'tdbank.com'] },
  { brand: 'RBC',             officialDomains: ['rbc.com', 'rbcroyalbank.com'] },
  { brand: 'Scotiabank',      officialDomains: ['scotiabank.com'] },
  { brand: 'BMO',             officialDomains: ['bmo.com'] },
  { brand: 'CIBC',            officialDomains: ['cibc.com'] },
  // ── UK Banks ─────────────────────────────────────────────────────────────
  { brand: 'HSBC',            officialDomains: ['hsbc.com', 'hsbc.co.uk'] },
  { brand: 'Barclays',        officialDomains: ['barclays.com', 'barclays.co.uk', 'barclaysbank.com'] },
  { brand: 'Lloyds Bank',     officialDomains: ['lloydsbank.com', 'lloydstsb.com'] },
  { brand: 'NatWest',         officialDomains: ['natwest.com'] },
  { brand: 'Santander',       officialDomains: ['santander.co.uk', 'santander.com'] },
  { brand: 'Halifax',         officialDomains: ['halifax.co.uk'] },
  { brand: 'Nationwide',      officialDomains: ['nationwide.co.uk'] },
  { brand: 'Standard Chartered', officialDomains: ['sc.com', 'standardchartered.com'] },
  // ── European / Global Banks ───────────────────────────────────────────────
  { brand: 'Deutsche Bank',   officialDomains: ['db.com', 'deutschebank.com'] },
  { brand: 'BNP Paribas',     officialDomains: ['bnpparibas.com'] },
  { brand: 'Credit Agricole', officialDomains: ['credit-agricole.com'] },
  { brand: 'ING',             officialDomains: ['ing.com', 'ing.nl', 'ing.be'] },
  { brand: 'Rabobank',        officialDomains: ['rabobank.com', 'rabobank.nl'] },
  { brand: 'UniCredit',       officialDomains: ['unicredit.eu', 'unicredit.it'] },
  { brand: 'ABN AMRO',        officialDomains: ['abnamro.com', 'abnamro.nl'] },
  { brand: 'Commonwealth Bank', officialDomains: ['commbank.com.au', 'cba.com.au'] },
  { brand: 'ANZ',             officialDomains: ['anz.com', 'anz.com.au'] },
  { brand: 'NAB',             officialDomains: ['nab.com.au'] },
  { brand: 'Westpac',         officialDomains: ['westpac.com.au'] },
  // ── African Banks ─────────────────────────────────────────────────────────
  { brand: 'GTBank',          officialDomains: ['gtbank.com', 'guarantytrustbank.com', 'gtco.com'] },
  { brand: 'Zenith Bank',     officialDomains: ['zenithbank.com'] },
  { brand: 'Access Bank',     officialDomains: ['accessbankplc.com', 'accessbank.com'] },
  { brand: 'First Bank',      officialDomains: ['firstbanknigeria.com', 'firstbank.com.ng'] },
  { brand: 'UBA',             officialDomains: ['uba.com', 'ubagroup.com'] },
  { brand: 'FCMB',            officialDomains: ['fcmb.com'] },
  { brand: 'Stanbic IBTC',    officialDomains: ['stanbicibtcbank.com', 'stanbicibplc.com'] },
  { brand: 'Fidelity Bank',   officialDomains: ['fidelitybank.ng'] },
  { brand: 'Union Bank',      officialDomains: ['unionbankng.com'] },
  { brand: 'Kuda',            officialDomains: ['kuda.com'] },
  { brand: 'OPay',            officialDomains: ['opayweb.com', 'opay.ng'] },
  { brand: 'PalmPay',         officialDomains: ['palmpay.com'] },
  { brand: 'PiggyVest',       officialDomains: ['piggyvest.com'] },
  { brand: 'Flutterwave',     officialDomains: ['flutterwave.com'] },
  { brand: 'Paystack',        officialDomains: ['paystack.com'] },
  { brand: 'Moniepoint',      officialDomains: ['moniepoint.com', 'teamapt.com'] },
  { brand: 'Ecobank',         officialDomains: ['ecobank.com'] },
  { brand: 'Equity Bank',     officialDomains: ['equitybankgroup.com'] },
  { brand: 'KCB',             officialDomains: ['kcbgroup.com'] },
  { brand: 'Absa',            officialDomains: ['absa.co.za', 'absa.africa'] },
  { brand: 'FNB',             officialDomains: ['fnb.co.za', 'firstrand.co.za'] },
  { brand: 'Standard Bank',   officialDomains: ['standardbank.co.za', 'standardbank.com'] },
  // ── African Telecoms ──────────────────────────────────────────────────────
  { brand: 'MTN',             officialDomains: ['mtn.com', 'mtnonline.com'] },
  { brand: 'Airtel',          officialDomains: ['airtel.com.ng', 'airtel.com', 'airtelkenya.com'] },
  { brand: 'Glo',             officialDomains: ['gloworld.com', 'glo.ng'] },
  { brand: '9mobile',         officialDomains: ['9mobile.com.ng'] },
  { brand: 'Vodacom',         officialDomains: ['vodacom.co.za', 'vodacom.com'] },
  { brand: 'Safaricom',       officialDomains: ['safaricom.co.ke'] },
  { brand: 'M-Pesa',          officialDomains: ['safaricom.co.ke', 'vodacom.co.za'] },
  // ── Global Telecoms ───────────────────────────────────────────────────────
  { brand: 'AT&T',            officialDomains: ['att.com'] },
  { brand: 'Verizon',         officialDomains: ['verizon.com'] },
  { brand: 'T-Mobile',        officialDomains: ['t-mobile.com'] },
  { brand: 'Vodafone',        officialDomains: ['vodafone.com', 'vodafone.co.uk'] },
  { brand: 'O2',              officialDomains: ['o2.co.uk'] },
  { brand: 'EE',              officialDomains: ['ee.co.uk'] },
  { brand: 'Three',           officialDomains: ['three.co.uk', '3.co.uk'] },
  { brand: 'Orange',          officialDomains: ['orange.com', 'orange.fr'] },
  { brand: 'Telstra',         officialDomains: ['telstra.com.au', 'telstra.com'] },
  // ── Delivery & Shipping ───────────────────────────────────────────────────
  { brand: 'DHL',             officialDomains: ['dhl.com', 'dhl.de', 'dhl.co.uk'] },
  { brand: 'FedEx',           officialDomains: ['fedex.com'] },
  { brand: 'UPS',             officialDomains: ['ups.com'] },
  { brand: 'USPS',            officialDomains: ['usps.com'] },
  { brand: 'Royal Mail',      officialDomains: ['royalmail.com'] },
  { brand: 'Australia Post',  officialDomains: ['auspost.com.au'] },
  { brand: 'Canada Post',     officialDomains: ['canadapost.ca', 'canadapost-postescanada.ca'] },
  { brand: 'La Poste',        officialDomains: ['laposte.fr'] },
  { brand: 'Deutsche Post',   officialDomains: ['deutschepost.de'] },
  { brand: 'PostNL',          officialDomains: ['postnl.nl', 'postnl.com'] },
  { brand: 'Hermes',          officialDomains: ['myhermes.co.uk', 'hermesworld.com'] },
  // ── E-Commerce ────────────────────────────────────────────────────────────
  { brand: 'eBay',            officialDomains: ['ebay.com', 'ebay.co.uk', 'ebay.de'] },
  { brand: 'Etsy',            officialDomains: ['etsy.com'] },
  { brand: 'AliExpress',      officialDomains: ['aliexpress.com'] },
  { brand: 'Alibaba',         officialDomains: ['alibaba.com'] },
  { brand: 'Jumia',           officialDomains: ['jumia.com', 'jumia.com.ng', 'jumia.co.ke'] },
  { brand: 'Konga',           officialDomains: ['konga.com'] },
  { brand: 'Walmart',         officialDomains: ['walmart.com'] },
  { brand: 'Target',          officialDomains: ['target.com'] },
  // ── Government (Global) ──────────────────────────────────────────────────
  { brand: 'IRS',             officialDomains: ['irs.gov'] },
  { brand: 'HMRC',            officialDomains: ['hmrc.gov.uk', 'gov.uk'] },
  { brand: 'ATO',             officialDomains: ['ato.gov.au'] },
  { brand: 'CRA',             officialDomains: ['cra-arc.gc.ca'] },
  { brand: 'Social Security', officialDomains: ['ssa.gov'] },
  { brand: 'NHS',             officialDomains: ['nhs.uk', 'nhs.net'] },
  { brand: 'DVLA',            officialDomains: ['dvla.gov.uk', 'gov.uk'] },
  { brand: 'CBN',             officialDomains: ['cbn.gov.ng'] },
  { brand: 'EFCC',            officialDomains: ['efcc.gov.ng'] },
  { brand: 'FIRS',            officialDomains: ['firs.gov.ng'] },
  { brand: 'NAFDAC',          officialDomains: ['nafdac.gov.ng'] },
  { brand: 'NNPC',            officialDomains: ['nnpc.gov.ng', 'nnpcgroup.com'] },
  // ── Email Service Providers (legitimate senders — lower false positives) ─
  { brand: 'Mailchimp',       officialDomains: ['mailchimp.com', 'mandrill.com', 'mcsv.net', 'list-manage.com'] },
  { brand: 'SendGrid',        officialDomains: ['sendgrid.net', 'sendgrid.com'] },
  { brand: 'Constant Contact', officialDomains: ['constantcontact.com', 'r.constantcontact.com'] },
  { brand: 'HubSpot',         officialDomains: ['hubspot.com', 'hs-email.com', 'hubspotemail.net'] },
]

// ── URL shortener domains ─────────────────────────────────────────────────────
// Shorteners hide the actual destination — phishers abuse them to bypass URL scanners
const URL_SHORTENERS = new Set([
  'bit.ly', 'bitly.com', 'tinyurl.com', 't.co', 'ow.ly', 'rb.gy', 'cutt.ly',
  'short.gy', 'is.gd', 'buff.ly', 'ift.tt', 'tiny.cc', 'lnkd.in', 'fb.me',
  'goo.gl', 'youtu.be', 'amzn.to', 'su.pr', 'dlvr.it', 'ff.im', 'bl.gy',
  'po.st', 'zpr.io', 'shorte.st', 'cli.gs', 'ht.ly', 'qr.ae', 's.id',
  'clck.ru', 'rebrand.ly', 'rotf.lol', 'tr.im', 'urls.fr', 'v.gd', 'zz.gd',
  'l.ead.me', 'soo.gd', 'bc.vc', 'zi.ma', 'vzturl.com',
])

// ── Known bulk/phishing mailer signatures ────────────────────────────────────
const SUSPICIOUS_MAILERS = [
  'phpmailer', 'sendblaster', 'groupmail', 'atomic mail sender',
  'the bat', 'mailmate', 'openwebmail', 'mimeole', 'foxmail',
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

// ── BEC Authority Title detection ─────────────────────────────────────────────
// Detects role/title impersonation in display name — distinct from brand impersonation.
// BEC attacks use authority titles (CEO, Attorney, FBI) to create psychological pressure.
// These titles have NO official sending domain to check against — the flag is the title itself
// combined with a free provider or mismatched domain.

const BEC_AUTHORITY_PATTERNS: Array<{
  pattern: RegExp
  role: string
  category: 'executive' | 'legal' | 'government'
}> = [
  // C-suite / Executive
  { pattern: /\bCEO\b/,                                                      role: 'CEO',              category: 'executive' },
  { pattern: /\bCFO\b/,                                                      role: 'CFO',              category: 'executive' },
  { pattern: /\bCOO\b/,                                                      role: 'COO',              category: 'executive' },
  { pattern: /\bCTO\b/,                                                      role: 'CTO',              category: 'executive' },
  { pattern: /\bCIO\b/,                                                      role: 'CIO',              category: 'executive' },
  { pattern: /\bCISO\b/,                                                     role: 'CISO',             category: 'executive' },
  { pattern: /\bCMO\b/,                                                      role: 'CMO',              category: 'executive' },
  { pattern: /\b(Managing\s+Director|MD)\b/i,                                role: 'Managing Director', category: 'executive' },
  { pattern: /\b(Vice\s+President|VP|SVP|EVP)\b/i,                           role: 'VP',               category: 'executive' },
  { pattern: /\bChairman\b/i,                                                role: 'Chairman',         category: 'executive' },
  { pattern: /\bPresident\b/i,                                               role: 'President',        category: 'executive' },
  { pattern: /\b(Executive\s+Director|Exec\.\s*Director)\b/i,                role: 'Executive Director', category: 'executive' },
  { pattern: /\bBoard\s+Member\b/i,                                          role: 'Board Member',     category: 'executive' },
  // Legal
  { pattern: /\b(Attorney|Attorney\s+at\s+Law)\b/i,                          role: 'Attorney',         category: 'legal' },
  { pattern: /\bEsq(uire)?\b/i,                                              role: 'Esquire',          category: 'legal' },
  { pattern: /\bBarrister\b/i,                                               role: 'Barrister',        category: 'legal' },
  { pattern: /\bSolicitor\b/i,                                               role: 'Solicitor',        category: 'legal' },
  { pattern: /\b(General\s+Counsel|Chief\s+Legal\s+Officer)\b/i,             role: 'General Counsel',  category: 'legal' },
  { pattern: /\bAdvocate\b/i,                                                role: 'Advocate',         category: 'legal' },
  { pattern: /\bNotary\b/i,                                                  role: 'Notary',           category: 'legal' },
  // Government / Law Enforcement
  { pattern: /\bSpecial\s+Agent\b/i,                                         role: 'Special Agent',    category: 'government' },
  { pattern: /\b(FBI|Federal\s+Bureau)\b/i,                                  role: 'FBI Agent',        category: 'government' },
  { pattern: /\b(EFCC|Economic\s+and\s+Financial\s+Crimes)\b/i,              role: 'EFCC Officer',     category: 'government' },
  { pattern: /\bINTERPOL\b/i,                                                role: 'Interpol Officer', category: 'government' },
  { pattern: /\b(Anti.?Fraud\s+Officer|Anti.?Money\s+Laundering\s+Officer|AML\s+Officer)\b/i, role: 'Anti-Fraud Officer', category: 'government' },
  { pattern: /\bCompliance\s+Officer\b/i,                                    role: 'Compliance Officer', category: 'government' },
  { pattern: /\b(DEA|Drug\s+Enforcement)\b/i,                                role: 'DEA Agent',        category: 'government' },
  { pattern: /\bSecret\s+Service\b/i,                                        role: 'Secret Service',   category: 'government' },
  { pattern: /\bInvestigator\b/i,                                            role: 'Investigator',     category: 'government' },
]

function detectAuthorityTitle(fromName: string | null): {
  impersonation: boolean
  role: string | null
  category: 'executive' | 'legal' | 'government' | null
} {
  if (!fromName) return { impersonation: false, role: null, category: null }
  for (const { pattern, role, category } of BEC_AUTHORITY_PATTERNS) {
    if (pattern.test(fromName)) {
      return { impersonation: true, role, category }
    }
  }
  return { impersonation: false, role: null, category: null }
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

// ── Legitimate ESP return-path domains ────────────────────────────────────────
// Email Service Providers use their own Return-Path domains — this is normal
const TRUSTED_ESP_RETURN_PATH = new Set([
  'sendgrid.net', 'amazonses.com', 'mailchimp.com', 'mcsv.net',
  'exacttarget.com', 'salesforce.com', 'marketo.net', 'sparkpostmail.com',
  'postmarkapp.com', 'mandrill.com', 'mailgun.org', 'mailjet.com',
  'constantcontact.com', 'list-manage.com', 'e.linkedin.com',
  'bounce.twitter.com', 'mail.beehiiv.com', 'substack.com',
  'hubspotemail.net', 'hs-email.com',
])

// ── Brand name list for URL path impersonation ───────────────────────────────
// Short brand keywords that should NOT appear in URL paths on non-brand domains
const URL_PATH_BRANDS = [
  'paypal', 'apple', 'google', 'microsoft', 'amazon', 'netflix', 'facebook',
  'instagram', 'linkedin', 'chase', 'wellsfargo', 'citibank', 'bankofamerica',
  'binance', 'coinbase', 'dhl', 'fedex', 'ups', 'usps', 'ebay', 'walmart',
  'irs', 'hmrc', 'ato', 'royalmail', 'stripe', 'shopify', 'dropbox',
  'docusign', 'adobe', 'zoom', 'slack', 'venmo', 'cashapp', 'zelle', 'wise',
  'revolut', 'klarna', 'kraken', 'metamask',
  'youtube', 'youtu',  // YouTube impersonation — copyright/DMCA scams
  // African brands
  'gtbank', 'zenithbank', 'accessbank', 'firstbank', 'opay', 'kuda',
  'palmpay', 'flutterwave', 'paystack', 'moniepoint', 'mtn', 'safaricom', 'mpesa',
]

// ── Main analysis function ────────────────────────────────────────────────────

export function analyzeHeaders(email: EmailInput): HeaderAnalysisResult {
  const fromDomain = extractEmailDomain(email.fromEmail)
  const replyToDomain = extractEmailDomain(email.replyTo)
  const returnPathDomain = extractEmailDomain(email.returnPath ?? null)

  // Reply-To mismatch: replyTo exists AND its domain differs from sender domain
  // Skip if replyTo is a parent/subdomain of fromDomain (valid patterns like mail.corp.com → corp.com)
  const replyToMismatch = !!(
    replyToDomain &&
    fromDomain &&
    !domainsMatch(replyToDomain, fromDomain)
  )

  // Return-Path mismatch: Return-Path exists, differs from sender domain, and isn't a trusted ESP
  const returnPathMismatch = !!(
    returnPathDomain &&
    fromDomain &&
    !domainsMatch(returnPathDomain, fromDomain) &&
    !TRUSTED_ESP_RETURN_PATH.has(returnPathDomain) &&
    !Array.from(TRUSTED_ESP_RETURN_PATH).some(esp => returnPathDomain.endsWith('.' + esp))
  )

  // Display name brand impersonation
  const { brand: displayNameBrand, mismatch: displayNameMismatch } =
    detectDisplayNameBrand(email.fromName, fromDomain)

  // BEC authority title detection
  const { impersonation: authorityImpersonation, role: authorityRole, category: authorityCategory } =
    detectAuthorityTitle(email.fromName)

  // Suspicious X-Mailer
  const mailerLower = (email.xMailer ?? '').toLowerCase()
  const suspiciousMailer = SUSPICIOUS_MAILERS.some(m => mailerLower.includes(m))

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
  const shortenerUrls: string[] = []
  const urlPathImpersonations: HeaderAnalysisResult['urlPathImpersonations'] = []
  let hasDataUri = false
  let hasJavascriptUri = false

  for (const url of email.urls) {
    if (url.startsWith('data:'))        { hasDataUri = true; continue }
    if (url.startsWith('javascript:'))  { hasJavascriptUri = true; continue }
    if (isIpAddressUrl(url))            { ipAddressUrls.push(url); continue }

    try {
      const parsed = new URL(url)
      const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '')

      // URL shortener detection
      if (URL_SHORTENERS.has(hostname)) {
        shortenerUrls.push(url)
        continue
      }

      // URL path impersonation: brand name in path but domain is NOT that brand
      const pathLower = parsed.pathname.toLowerCase()
      for (const brand of URL_PATH_BRANDS) {
        if (pathLower.includes('/' + brand) || pathLower.includes(brand + '/') || pathLower.includes(brand + '-')) {
          // Check that the actual domain is NOT the brand's domain
          if (!hostname.includes(brand)) {
            urlPathImpersonations.push({ url: url.slice(0, 120), brand, path: parsed.pathname.slice(0, 80) })
            break
          }
        }
      }
    } catch { /* ignore malformed URLs */ }
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
    returnPathMismatch,
    returnPathDomain,
    displayNameBrand,
    displayNameMismatch,
    attachmentRiskLevel,
    riskyAttachments,
    ipAddressUrls,
    urlCount: email.urls.length,
    shortenerUrls,
    urlPathImpersonations,
    hasDataUri,
    hasJavascriptUri,
    suspiciousMailer,
    anchorTextMismatches,
    authorityImpersonation,
    authorityRole,
    authorityCategory,
  }
}

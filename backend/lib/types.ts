export interface EmailInput {
  fromName: string | null
  fromEmail: string | null
  subject: string | null
  date: string | null
  bodyText: string | null
  urls: string[]
  anchorLinks?: Array<{ text: string; href: string }>  // link text + href pairs for mismatch detection
  attachments: Array<{ name: string; type: string; extension?: string }>
  replyTo: string | null
  returnPath?: string | null   // Return-Path header (actual delivery address — mismatch = spoofing)
  xMailer?: string | null      // X-Mailer / User-Agent sending software
  messageId: string | null
  gmailAuth?: { signedBy: string | null; mailedBy: string | null }
  gmailWarning?: boolean       // Gmail's own phishing/spam warning banner was visible
}

export interface HaikuResult {
  pre_score: number
  signals: string[]
  urls_found: string[]
  escalate_to_sonnet: boolean
  error?: string
}

export interface DnsResult {
  spf: 'pass' | 'fail' | 'neutral' | 'none' | 'error'
  dkim: 'present' | 'absent' | 'unknown' | 'error'
  dmarc: { policy: 'none' | 'quarantine' | 'reject' | 'error'; raw: string }
  hasMx?: boolean   // domain has MX records (false = domain can't receive email legitimately)
  error?: string
}

export interface VirusTotalResult {
  flagged: boolean
  results: Array<{ url: string; malicious: number; suspicious: number; engines: string[] }>
  error?: string
}

export interface SafeBrowsingResult {
  flagged: boolean
  threats: Array<{ url: string; threatType: string }>
  error?: string
}

export interface RdapResult {
  registrationDate: string | null
  ageInDays: number | null
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN'
  registrar: string | null
  error?: string
}

export interface Flag {
  label: string
  detail?: string
  evidence?: string
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  module: string
}

export interface PhishTankResult {
  flagged: boolean
  phishingUrls: string[]
  error?: string
}

export interface URLhausResult {
  flagged: boolean
  malwareUrls: string[]
  error?: string
}

/**
 * Header-level analysis results — computed deterministically from email metadata.
 * No AI required — pure logic.
 */
export interface HeaderAnalysisResult {
  replyToMismatch: boolean              // replyTo domain ≠ fromEmail domain
  replyToDomain: string | null          // extracted replyTo domain
  returnPathMismatch: boolean           // Return-Path domain ≠ fromEmail domain (spoofing)
  returnPathDomain: string | null       // extracted Return-Path domain
  displayNameBrand: string | null       // brand detected in display name (e.g., "PayPal")
  displayNameMismatch: boolean          // fromName contains a brand but domain doesn't match
  attachmentRiskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  riskyAttachments: string[]            // names of risky attachments
  ipAddressUrls: string[]               // URLs using raw IP addresses
  urlCount: number                      // total URL count
  shortenerUrls: string[]               // URLs via known URL shorteners (bit.ly, tinyurl, etc.)
  urlPathImpersonations: Array<{ url: string; brand: string; path: string }> // brand name in URL path on non-brand domain
  hasDataUri: boolean                   // data: URI scheme (always suspicious in email)
  hasJavascriptUri: boolean             // javascript: URI scheme
  suspiciousMailer: boolean             // X-Mailer is a known bulk/phishing tool
  anchorTextMismatches: Array<{ text: string; href: string; textDomain: string; hrefDomain: string }>
}

/**
 * Domain similarity results — detects impersonation via lookalike domains.
 */
export interface DomainSimilarityResult {
  isLookalike: boolean
  targetBrand: string | null
  technique: 'typosquatting' | 'homograph_idn' | 'combo_squatting' | 'subdomain_impersonation' | null
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  detail: string | null
}

export interface SpamhausResult {
  checked: boolean
  dblPhishing: boolean     // sender domain on Spamhaus DBL phishing list
  dblMalware: boolean      // sender domain on Spamhaus DBL malware list
  dblSpam: boolean         // sender domain on Spamhaus DBL spam list
  sblListed: boolean       // any Spamhaus listing
  error?: string
}

export interface EmailRepResult {
  suspicious: boolean      // flagged as suspicious (disposable = suspicious)
  blacklisted: boolean     // in known malicious sender lists (via SpamHaus/OTX)
  disposable: boolean      // disposable/temporary email address (deterministic check)
  maliciousActivity: boolean // linked to malicious campaigns
  spoofing: boolean        // known spoofing patterns
  error?: string
}

export interface OTXResult {
  checked: boolean
  malicious: boolean       // community-reported as malicious
  pulseCount: number       // number of OTX threat reports for this domain
  tags: string[]           // threat categories (phishing, malware, etc.)
  error?: string
}

export interface TldRiskResult {
  tld: string
  isHighRisk: boolean      // .xyz, .top, .tk, .ml, .ga, .cf etc.
  isFreeRegistration: boolean // free TLD (Freenom: .tk, .ml, .ga, .cf, .gq)
}

// Shared intel payload — passed to Mercury and rule scorer
export interface AnalysisIntel {
  dns: DnsResult
  vt: VirusTotalResult
  sb: SafeBrowsingResult
  rdap: RdapResult
  phishtank?: PhishTankResult
  urlhaus?: URLhausResult
  spamhaus?: SpamhausResult            // Spamhaus DBL domain reputation (free, DNS-based)
  emailRep?: EmailRepResult            // disposable email + sender pattern checks (deterministic)
  otx?: OTXResult                      // AlienVault OTX community threat intel (free commercial key)
  headerAnalysis?: HeaderAnalysisResult    // header-level signals (reply-to, display name, attachments)
  domainSimilarity?: DomainSimilarityResult // lookalike/typosquatting detection on sender domain
  urlDomainSimilarity?: DomainSimilarityResult[] // lookalike detection on URL domains
  tldRisk?: TldRiskResult             // TLD-level risk assessment
  trustHint?: string      // set when sender domain is in the trusted allowlist
  freeProvider?: boolean  // true for gmail.com, outlook.com etc — trust cap NOT applied for free providers
  gmailWarning?: boolean  // Gmail's own phishing/spam warning banner was showing
}

export interface AnalysisReport {
  risk_score: number
  risk_level: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  verdict: string
  recommendation: string
  green_flags: Array<{ label: string; detail: string; module: string }>
  red_flags: Array<{ label: string; evidence: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; module: string }>
  modules: {
    sender_auth: object
    domain_intel: object
    content_analysis: object
    url_analysis: object
    behavioral: object
  }
  analysis_path: 'mercury_deep' | 'haiku_fast' | 'rule_based'
  duration_ms: number
}

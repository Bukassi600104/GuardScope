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
  messageId: string | null
  gmailAuth?: { signedBy: string | null; mailedBy: string | null }
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
  displayNameBrand: string | null       // brand detected in display name (e.g., "PayPal")
  displayNameMismatch: boolean          // fromName contains a brand but domain doesn't match
  attachmentRiskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  riskyAttachments: string[]            // names of risky attachments
  ipAddressUrls: string[]               // URLs using raw IP addresses
  urlCount: number                      // total URL count
  hasDataUri: boolean                   // data: URI scheme (always suspicious in email)
  hasJavascriptUri: boolean             // javascript: URI scheme
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

// Shared intel payload — passed to Mercury and rule scorer
export interface AnalysisIntel {
  dns: DnsResult
  vt: VirusTotalResult
  sb: SafeBrowsingResult
  rdap: RdapResult
  phishtank?: PhishTankResult
  urlhaus?: URLhausResult
  headerAnalysis?: HeaderAnalysisResult    // header-level signals (reply-to, display name, attachments)
  domainSimilarity?: DomainSimilarityResult // lookalike/typosquatting detection
  trustHint?: string      // set when sender domain is in the trusted allowlist
  freeProvider?: boolean  // true for gmail.com, outlook.com etc — trust cap NOT applied for free providers
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

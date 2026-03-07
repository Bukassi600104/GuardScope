export interface EmailInput {
  fromName: string | null
  fromEmail: string | null
  subject: string | null
  date: string | null
  bodyText: string | null
  urls: string[]
  attachments: Array<{ name: string; type: string }>
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

// Shared intel payload — same shape for both Mercury and Sonnet paths
export interface AnalysisIntel {
  dns: DnsResult
  vt: VirusTotalResult
  sb: SafeBrowsingResult
  rdap: RdapResult
  trustHint?: string  // set when sender domain is in the trusted allowlist
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

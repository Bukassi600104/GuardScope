// GuardScope Analysis Types — mirrors backend types.ts (lightweight client version)

export interface AnalysisReport {
  risk_score: number
  risk_level: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  verdict: string
  recommendation: string
  green_flags: Array<{ label: string; detail: string; module: string }>
  red_flags: Array<{ label: string; evidence: string; severity: string; module: string }>
  modules: {
    sender_auth: { spf: string; dkim: string; dmarc: string }
    domain_intel: { age_days: number | null; risk_level: string; registrar: string | null }
    content_analysis: { signals: string[]; urgency_score: number; assessment: string }
    url_analysis: { vt_flagged: boolean; sb_flagged: boolean; flagged_urls: string[] }
    behavioral: { urgency_indicators: string[]; impersonation_risk: string }
  }
  analysis_path: string
  duration_ms: number
}

export type AppState = 'idle' | 'analyzing' | 'result' | 'error' | 'no_email' | 'limit_reached'

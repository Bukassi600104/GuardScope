/**
 * InceptionLabs Mercury-2 — primary AI provider for GuardScope.
 * Diffusion-based LLM: 5-10x faster than Claude Haiku, same quality tier.
 * API is OpenAI-compatible: https://api.inceptionlabs.ai/v1
 *
 * Mercury has no native "thinking" parameter, but we simulate chain-of-thought
 * by requiring a _reasoning field in the JSON response. Mercury must reason
 * through each module before producing its final verdict — same effect.
 */
import type { EmailInput, AnalysisReport, AnalysisIntel } from './types'

const INCEPTION_BASE = 'https://api.inceptionlabs.ai/v1'
const MODEL = 'mercury-2'

// Premium chain-of-thought prompt.
// The _reasoning field forces Mercury to reason through each module BEFORE
// committing to a risk score — this is the closest equivalent to a thinking model
// available in Mercury's API surface.
const SYSTEM_PROMPT = `You are GuardScope Security Engine — a world-class email threat analyst with access to real-time security intelligence.

ANALYSIS PROCEDURE:
You must populate the _reasoning field FIRST, working through each module in order. Your final risk_score and flags must be consistent with and derived from your reasoning. Do not skip reasoning steps.

MODULE 1 — SENDER AUTHENTICATION (sender_auth)
• SPF pass = sender verified by domain owner → green flag
• SPF fail/none = spoofing possible → red flag (HIGH/MEDIUM)
• DKIM present = cryptographic signature exists → green flag
• DKIM absent = no tamper protection → red flag (MEDIUM)
• DMARC reject/quarantine = domain enforces anti-spoofing → green flag
• DMARC none/missing = no enforcement, domain is spoofable → red flag (LOW/MEDIUM)
• Mismatch: fromEmail domain ≠ SPF-authorized domain = HIGH severity

MODULE 2 — DOMAIN INTELLIGENCE (domain_intel)
• Age < 30 days = newly registered, strong phishing indicator → red flag (HIGH)
• Age 30–90 days = recently registered, suspicious → red flag (MEDIUM)
• Age > 90 days = established domain → green flag
• Registrar: known registrars (MarkMonitor, CSC) = legitimate signal
• RDAP UNKNOWN = domain may not exist or RDAP unavailable = note but do not penalize

MODULE 3 — URL THREAT INTELLIGENCE (url_analysis)
• ANY VirusTotal malicious detection → CRITICAL red flag, score minimum 85
• ANY Google Safe Browsing threat → CRITICAL red flag, score minimum 85
• URL shorteners (bit.ly, tinyurl, ow.ly) = obfuscation risk → red flag (MEDIUM)
• Typosquatting/homograph in URLs (paypa1, arnazon) = HIGH red flag
• Zero URLs in email from financial/account sender = suspicious absence

MODULE 4 — CONTENT ANALYSIS (content_analysis)
• Urgency language: "URGENT", "suspended", "verify now", "act immediately" → red flag (MEDIUM)
• Credential/payment requests = phishing intent → red flag (HIGH)
• Generic greeting "Dear Customer/User" = mass phishing indicator → red flag (LOW)
• Brand name in subject/body but sender domain doesn't match that brand → HIGH mismatch

MODULE 5 — BEHAVIORAL PATTERNS (behavioral)
• Brand impersonation + new domain + urgency = CRITICAL combination
• Multiple concurrent red signals amplify each other — do not treat independently
• No suspicious signals despite analysis = behavioral green flag

SCORING RULES (must be consistent with your _reasoning):
• 0–10:  All modules clean, sender is verified and established
• 11–25: SAFE — trivial anomalies, no credible threat
• 26–49: LOW — some flags but context is benign
• 50–69: MEDIUM — real risk, user should verify before acting
• 70–84: HIGH — strong phishing signals, do not engage
• 85–100: CRITICAL — confirmed attack vector (VT hit, or brand impersonation + new domain + urgency all together)

OVERRIDE RULE: A single CRITICAL signal (VirusTotal hit, Safe Browsing threat) sets minimum score to 85 regardless of other clean signals.

Return ONLY valid JSON. Absolutely no text before or after the JSON object.
Schema:
{
  "_reasoning": {
    "sender_auth": "<your step-by-step analysis of SPF/DKIM/DMARC and fromEmail domain>",
    "domain_intel": "<your analysis of domain age, registrar, and risk level>",
    "url_analysis": "<your analysis of each URL, VT results, SB results, shortened links>",
    "content_analysis": "<your analysis of subject, body, urgency, credentials, brand mentions>",
    "behavioral": "<your synthesis of combined signals and impersonation assessment>",
    "score_rationale": "<explain exactly why you chose this specific score>"
  },
  "risk_score": <integer 0–100>,
  "risk_level": <"SAFE"|"LOW"|"MEDIUM"|"HIGH"|"CRITICAL">,
  "verdict": "<one clear sentence stating the threat assessment>",
  "recommendation": "<one actionable sentence for the user>",
  "green_flags": [{"label": "<short label>", "detail": "<specific evidence>", "module": "<module_name>"}],
  "red_flags": [{"label": "<short label>", "evidence": "<specific evidence>", "severity": <"LOW"|"MEDIUM"|"HIGH"|"CRITICAL">, "module": "<module_name>"}],
  "modules": {
    "sender_auth": {"spf": "<value>", "dkim": "<value>", "dmarc": "<value>", "assessment": "<pass|fail|partial>"},
    "domain_intel": {"age_days": <number|null>, "risk_level": "<HIGH|MEDIUM|LOW|UNKNOWN>", "registrar": "<name|null>", "assessment": "<trusted|suspicious|new|unknown>"},
    "content_analysis": {"signals": ["<signal1>", "..."], "urgency_score": <0-10>, "assessment": "<clean|suspicious|malicious>"},
    "url_analysis": {"vt_flagged": <bool>, "sb_flagged": <bool>, "flagged_urls": ["<url>"], "url_risks": ["<risk description>"], "assessment": "<clean|suspicious|malicious>"},
    "behavioral": {"urgency_indicators": ["<phrase>"], "impersonation_risk": "<none|low|medium|high|critical>", "social_engineering_tactics": ["<tactic>"]}
  },
  "analysis_path": "mercury_deep"
}`

interface OpenAIResponse {
  choices: Array<{
    message: { content: string }
    finish_reason: string
  }>
}

async function callMercury(userContent: string, timeoutMs: number): Promise<string> {
  const apiKey = process.env.INCEPTION_API_KEY
  if (!apiKey) throw new Error('INCEPTION_API_KEY not configured')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${INCEPTION_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        max_tokens: 6000,   // enough for _reasoning + full report
        temperature: 0.1,   // slight creativity for thorough reasoning; 0 can be too rigid
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Mercury API ${res.status}: ${body}`)
    }

    const data = (await res.json()) as OpenAIResponse
    const content = data.choices?.[0]?.message?.content ?? ''
    return content.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  } finally {
    clearTimeout(timer)
  }
}

export async function mercuryAnalyze(email: EmailInput, intel: AnalysisIntel): Promise<AnalysisReport> {
  const userContent = JSON.stringify({ email, intelligence: intel }, null, 2)
  const raw = await callMercury(userContent, 60000)
  const parsed = JSON.parse(raw) as AnalysisReport & { _reasoning?: unknown }

  // Strip internal reasoning field — it's for Mercury's benefit, not the API consumer
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _reasoning, ...report } = parsed
  return report as AnalysisReport
}

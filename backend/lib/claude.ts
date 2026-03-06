import Anthropic from '@anthropic-ai/sdk'
import type { EmailInput, HaikuResult, AnalysisReport, DnsResult, VirusTotalResult, SafeBrowsingResult, RdapResult } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const HAIKU_SYSTEM = `You are a phishing pre-screening classifier.
Return ONLY valid JSON with this exact shape — no prose, no markdown:
{"pre_score": <integer 0-100>, "signals": ["<brief signal>"], "urls_found": ["<url>"], "escalate_to_sonnet": <boolean>}
escalate_to_sonnet must be true if pre_score >= 26.
pre_score rubric: urgency language +10, mismatched sender domain +15, suspicious URLs +20, credential request +20, generic greeting +5.`

const SONNET_SYSTEM = `You are an expert email security analyst. Analyze the email and all provided threat intelligence.
Run 5 analysis modules: sender_auth, domain_intel, content_analysis, url_analysis, behavioral.
Return ONLY the full AnalysisReport JSON — no prose, no markdown, no explanation:
{
  "risk_score": <integer 0-100>,
  "risk_level": <"SAFE"|"LOW"|"MEDIUM"|"HIGH"|"CRITICAL">,
  "verdict": "<one-sentence summary>",
  "recommendation": "<one-sentence action>",
  "green_flags": [{"label": "...", "detail": "...", "module": "sender_auth|domain_intel|content_analysis|url_analysis|behavioral"}],
  "red_flags": [{"label": "...", "evidence": "...", "severity": <"LOW"|"MEDIUM"|"HIGH"|"CRITICAL">, "module": "..."}],
  "modules": {
    "sender_auth": {"spf": "...", "dkim": "...", "dmarc": "..."},
    "domain_intel": {"age_days": <number|null>, "risk_level": "...", "registrar": "..."},
    "content_analysis": {"signals": [], "pre_score": <number>},
    "url_analysis": {"vt_flagged": <bool>, "sb_flagged": <bool>, "flagged_urls": []},
    "behavioral": {"urgency_indicators": [], "impersonation_risk": "..."}
  },
  "analysis_path": "sonnet_deep"
}
Risk scale: 0-25 SAFE, 26-49 LOW, 50-69 MEDIUM, 70-84 HIGH, 85-100 CRITICAL.`

export async function haikuPrescan(email: EmailInput): Promise<HaikuResult> {
  try {
    const response = await client.messages.create(
      {
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        temperature: 0,
        system: HAIKU_SYSTEM,
        messages: [{ role: 'user', content: JSON.stringify(email) }],
      },
      { timeout: 8000 }
    )

    const block = response.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response type from Haiku')

    const text = block.text.trim()
    // Strip markdown code fences if model wraps JSON
    const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(clean) as HaikuResult
    return {
      pre_score: Number(parsed.pre_score) || 0,
      signals: Array.isArray(parsed.signals) ? parsed.signals : [],
      urls_found: Array.isArray(parsed.urls_found) ? parsed.urls_found : [],
      escalate_to_sonnet: Boolean(parsed.escalate_to_sonnet),
    }
  } catch (err) {
    return { pre_score: 0, signals: [], urls_found: [], escalate_to_sonnet: false, error: String(err) }
  }
}

export async function sonnetDeepAnalysis(
  email: EmailInput,
  intel: {
    haiku: HaikuResult
    dns: DnsResult
    vt: VirusTotalResult
    sb: SafeBrowsingResult
    rdap: RdapResult
  }
): Promise<AnalysisReport> {
  const userContent = JSON.stringify({ email, intelligence: intel }, null, 2)

  const response = await client.messages.create(
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      temperature: 0,
      system: SONNET_SYSTEM,
      messages: [{ role: 'user', content: userContent }],
    },
    { timeout: 60000 }
  )

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Sonnet')

  const text = block.text.trim()
  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(clean) as AnalysisReport
}

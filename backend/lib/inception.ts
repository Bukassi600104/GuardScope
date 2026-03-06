/**
 * InceptionLabs Mercury — AI provider alternative to Claude.
 * Mercury is a diffusion-based LLM optimized for speed.
 * API is OpenAI-compatible: https://api.inceptionlabs.ai/v1
 * Docs: https://docs.inceptionlabs.ai/get-started/get-started
 */
import type { EmailInput, HaikuResult, AnalysisReport, DnsResult, VirusTotalResult, SafeBrowsingResult, RdapResult } from './types'

const INCEPTION_BASE = 'https://api.inceptionlabs.ai/v1'
const PRESCAN_MODEL = 'mercury-2'  // mercury-2: best quality, 5-10x faster than Haiku
const DEEP_MODEL = 'mercury-2'     // mercury-2 for both paths — single model, consistent results

const PRESCAN_SYSTEM = `You are a phishing pre-screening classifier.
Return ONLY valid JSON with this exact shape — no prose, no markdown:
{"pre_score": <integer 0-100>, "signals": ["<brief signal>"], "urls_found": ["<url>"], "escalate_to_sonnet": <boolean>}
escalate_to_sonnet must be true if pre_score >= 26.
pre_score rubric: urgency language +10, mismatched sender domain +15, suspicious URLs +20, credential request +20, generic greeting +5.`

const DEEP_SYSTEM = `You are an expert email security analyst. Analyze the email and all provided threat intelligence.
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
  "analysis_path": "mercury_deep"
}
Risk scale: 0-25 SAFE, 26-49 LOW, 50-69 MEDIUM, 70-84 HIGH, 85-100 CRITICAL.`

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIResponse {
  choices: Array<{
    message: { content: string }
    finish_reason: string
  }>
}

async function callMercury(
  model: string,
  messages: OpenAIMessage[],
  maxTokens: number,
  timeoutMs: number
): Promise<string> {
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
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0,
        response_format: { type: 'json_object' },  // Mercury supports json_mode natively
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

export async function mercuryPrescan(email: EmailInput): Promise<HaikuResult> {
  try {
    const text = await callMercury(
      PRESCAN_MODEL,
      [
        { role: 'system', content: PRESCAN_SYSTEM },
        { role: 'user', content: JSON.stringify(email) },
      ],
      1024,
      10000
    )

    const parsed = JSON.parse(text) as HaikuResult
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

export async function mercuryDeepAnalysis(
  email: EmailInput,
  intel: {
    haiku: HaikuResult
    dns: DnsResult
    vt: VirusTotalResult
    sb: SafeBrowsingResult
    rdap: RdapResult
  }
): Promise<AnalysisReport> {
  const text = await callMercury(
    DEEP_MODEL,
    [
      { role: 'system', content: DEEP_SYSTEM },
      { role: 'user', content: JSON.stringify({ email, intelligence: intel }, null, 2) },
    ],
    4096,
    60000
  )

  return JSON.parse(text) as AnalysisReport
}

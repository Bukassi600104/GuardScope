import { hasHashSecret, securityHash } from './securityHash'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''

const MAJOR_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'me.com',
  'proton.me',
  'protonmail.com',
])

const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'mailinator.com',
  'guerrillamail.com',
  'yopmail.com',
  'sharklasers.com',
  'trashmail.com',
])

type PromoGuardInput = {
  email: string
  ip: string
  userAgent: string
  honeypot?: string
  startedAt?: number
}

type PromoGuardResult = {
  allowed: boolean
  reason: string
  emailHash?: string
  ipHash?: string
  userAgentHash?: string
}

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SERVICE_KEY && hasHashSecret())
}

function headers(extra?: Record<string, string>) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

function parseCount(value: string | null) {
  const count = value?.split('/')[1]
  return count && count !== '*' ? parseInt(count, 10) : 0
}

function emailDomain(email: string) {
  return email.toLowerCase().trim().split('@')[1] ?? ''
}

async function countAttempts(query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/promo_claim_attempts?${query}&select=id`, {
    headers: headers({ Prefer: 'count=exact', Range: '0-0' }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`promo_claim_attempts count failed with ${res.status}`)
  return parseCount(res.headers.get('content-range'))
}

async function recordAttempt(input: {
  emailHash: string
  ipHash: string
  userAgentHash: string
  emailDomain: string
  allowed: boolean
  reason: string
}) {
  await fetch(`${SUPABASE_URL}/rest/v1/promo_claim_attempts`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      email_hash: input.emailHash,
      ip_hash: input.ipHash,
      user_agent_hash: input.userAgentHash,
      email_domain: input.emailDomain,
      allowed: input.allowed,
      reason: input.reason,
    }),
  }).catch(() => {})
}

export async function guardPromoRequest(input: PromoGuardInput): Promise<PromoGuardResult> {
  const domain = emailDomain(input.email)
  const now = Date.now()
  const startedAt = typeof input.startedAt === 'number' ? input.startedAt : 0

  if (!hasSupabaseConfig()) {
    return {
      allowed: process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV !== 'production',
      reason: 'promo_abuse_store_unavailable',
    }
  }

  const emailHash = securityHash(`promo-email:${input.email.toLowerCase().trim()}`)
  const ipHash = securityHash(`promo-ip:${input.ip}`)
  const userAgentHash = securityHash(`promo-ua:${input.userAgent || 'unknown'}`)

  const deny = async (reason: string): Promise<PromoGuardResult> => {
    await recordAttempt({ emailHash, ipHash, userAgentHash, emailDomain: domain, allowed: false, reason })
    return { allowed: false, reason, emailHash, ipHash, userAgentHash }
  }

  if (!emailHash || !ipHash) return { allowed: false, reason: 'promo_abuse_hash_unavailable' }
  if (input.honeypot?.trim()) return deny('honeypot')
  if (DISPOSABLE_DOMAINS.has(domain)) return deny('disposable_email')
  if (startedAt && (now - startedAt < 2500 || now - startedAt > 2 * 60 * 60 * 1000)) return deny('timing_anomaly')

  const since24h = encodeURIComponent(new Date(now - 24 * 60 * 60 * 1000).toISOString())
  const since30d = encodeURIComponent(new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString())

  const [ipAllowed24h, ipTotal24h, emailAllowed30d, domainAllowed24h] = await Promise.all([
    countAttempts(`ip_hash=eq.${encodeURIComponent(ipHash)}&allowed=eq.true&created_at=gte.${since24h}`),
    countAttempts(`ip_hash=eq.${encodeURIComponent(ipHash)}&created_at=gte.${since24h}`),
    countAttempts(`email_hash=eq.${encodeURIComponent(emailHash)}&allowed=eq.true&created_at=gte.${since30d}`),
    MAJOR_EMAIL_DOMAINS.has(domain)
      ? Promise.resolve(0)
      : countAttempts(`email_domain=eq.${encodeURIComponent(domain)}&allowed=eq.true&created_at=gte.${since24h}`),
  ])

  if (emailAllowed30d >= 1) return deny('email_already_requested')
  if (ipAllowed24h >= 2) return deny('ip_daily_code_limit')
  if (ipTotal24h >= 8) return deny('ip_attempt_limit')
  if (!MAJOR_EMAIL_DOMAINS.has(domain) && domainAllowed24h >= 5) return deny('domain_daily_code_limit')

  await recordAttempt({ emailHash, ipHash, userAgentHash, emailDomain: domain, allowed: true, reason: 'allowed' })
  return { allowed: true, reason: 'allowed', emailHash, ipHash, userAgentHash }
}

export async function guardPromoResend(input: PromoGuardInput): Promise<PromoGuardResult> {
  const domain = emailDomain(input.email)
  const now = Date.now()

  if (!hasSupabaseConfig()) {
    return {
      allowed: process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV !== 'production',
      reason: 'promo_abuse_store_unavailable',
    }
  }

  const emailHash = securityHash(`promo-email:${input.email.toLowerCase().trim()}`)
  const ipHash = securityHash(`promo-ip:${input.ip}`)
  const userAgentHash = securityHash(`promo-ua:${input.userAgent || 'unknown'}`)

  const deny = async (reason: string): Promise<PromoGuardResult> => {
    await recordAttempt({ emailHash, ipHash, userAgentHash, emailDomain: domain, allowed: false, reason })
    return { allowed: false, reason, emailHash, ipHash, userAgentHash }
  }

  if (!emailHash || !ipHash) return { allowed: false, reason: 'promo_abuse_hash_unavailable' }
  if (input.honeypot?.trim()) return deny('honeypot')

  const since24h = encodeURIComponent(new Date(now - 24 * 60 * 60 * 1000).toISOString())
  const [emailResends24h, ipResends24h, ipTotal24h] = await Promise.all([
    countAttempts(`email_hash=eq.${encodeURIComponent(emailHash)}&reason=eq.resend_allowed&created_at=gte.${since24h}`),
    countAttempts(`ip_hash=eq.${encodeURIComponent(ipHash)}&reason=eq.resend_allowed&created_at=gte.${since24h}`),
    countAttempts(`ip_hash=eq.${encodeURIComponent(ipHash)}&created_at=gte.${since24h}`),
  ])

  if (emailResends24h >= 2) return deny('email_resend_daily_limit')
  if (ipResends24h >= 5) return deny('ip_resend_daily_limit')
  if (ipTotal24h >= 12) return deny('ip_attempt_limit')

  await recordAttempt({ emailHash, ipHash, userAgentHash, emailDomain: domain, allowed: true, reason: 'resend_allowed' })
  return { allowed: true, reason: 'resend_allowed', emailHash, ipHash, userAgentHash }
}

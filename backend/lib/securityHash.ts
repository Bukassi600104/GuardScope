import { createHmac } from 'crypto'

const HASH_SECRET =
  process.env.RATE_LIMIT_HASH_SECRET ??
  process.env.PROMO_ABUSE_SECRET ??
  process.env.CONTROL_PANEL_SESSION_SECRET ??
  process.env.SUPABASE_JWT_SECRET ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY ??
  ''

export function hasHashSecret() {
  return HASH_SECRET.length >= 16
}

export function securityHash(value: string) {
  if (!hasHashSecret()) return ''
  return createHmac('sha256', HASH_SECRET).update(value).digest('hex')
}

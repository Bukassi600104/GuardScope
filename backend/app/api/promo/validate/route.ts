import { NextRequest, NextResponse } from 'next/server'
import { redeemCode } from '../../../../lib/promo'
import { sendRedemptionConfirmation } from '../../../../lib/email'
import { checkRateLimit } from '../../../../lib/ratelimit'

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

export async function POST(req: NextRequest) {
  // Rate limit by IP — prevent brute-force of promo codes
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ip = /^[0-9a-fA-F.:]{3,45}$/.test(rawIp) ? rawIp : 'unknown'
  const rateLimit = await checkRateLimit(`promovalidate:${ip}`, false)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait before trying again.' },
      { status: 429, headers: SECURITY_HEADERS }
    )
  }

  let body: { code?: string; email?: string } = {}
  try { body = await req.json() } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }

  // Normalize + length-cap inputs
  const code  = typeof body.code  === 'string' ? body.code.trim().toUpperCase().slice(0, 30)   : ''
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : ''

  if (!code || code.length < 4) {
    return NextResponse.json(
      { error: 'Please enter a valid promo code.' },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'Please provide the email address associated with your GuardScope account.' },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }

  const result = await redeemCode(code, email)  // redeemCode uses timing-safe comparison

  if (!result.success) {
    return NextResponse.json(
      { error: result.reason },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }

  // Fire-and-forget confirmation email
  sendRedemptionConfirmation({
    to:           email,
    name:         email.split('@')[0],
    proExpiresAt: new Date(result.proExpiresAt),
  }).catch(err => console.error('[promo/validate] confirmation email failed:', err))

  return NextResponse.json(
    {
      success:      true,
      proExpiresAt: result.proExpiresAt,
      message:      'Pro access activated! Your account is now upgraded for 30 days.',
    },
    { headers: SECURITY_HEADERS }
  )
}

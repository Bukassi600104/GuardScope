import { NextRequest, NextResponse } from 'next/server'
import { redeemCode } from '../../../../lib/promo'
import { sendRedemptionConfirmation } from '../../../../lib/email'

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

export async function POST(req: NextRequest) {
  let body: { code?: string; email?: string } = {}
  try { body = await req.json() } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }

  const { code, email } = body

  if (!code || typeof code !== 'string' || code.trim().length < 4) {
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

  const result = await redeemCode(code, email)

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

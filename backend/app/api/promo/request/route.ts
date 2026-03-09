import { NextRequest, NextResponse } from 'next/server'
import { assignCodeToLead, getCodeForEmail, countRemainingCodes } from '../../../../lib/promo'
import { sendWelcomeEmail } from '../../../../lib/email'

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; country?: string } = {}
  try { body = await req.json() } catch { /* form fallback below */ }

  // Support both JSON body (fetch) and form submission
  if (!body.email) {
    try {
      const form = await req.formData()
      body = {
        name:    form.get('name') as string,
        email:   form.get('email') as string,
        country: form.get('country') as string,
      }
    } catch { /* ignore */ }
  }

  const { name, email, country } = body

  // Validate inputs
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json(
      { error: 'Please provide your full name.' },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'Please provide a valid email address.' },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }
  if (!country || typeof country !== 'string') {
    return NextResponse.json(
      { error: 'Please select your country.' },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }

  // Check if this email already has a code
  const existing = await getCodeForEmail(email)
  if (existing) {
    // Resend the same code — helpful if they lost the email
    try {
      await sendWelcomeEmail({
        to: email,
        name: existing.requester_name ?? name,
        code: existing.code,
        claimDeadline: new Date(existing.claim_deadline),
      })
    } catch (err) {
      console.error('[promo/request] resend email failed:', err)
    }
    return NextResponse.json(
      { success: true, message: 'We already sent you a code — check your inbox (and spam folder). We just resent it.' },
      { headers: SECURITY_HEADERS }
    )
  }

  // Check if codes remain
  const remaining = await countRemainingCodes()
  if (remaining === 0) {
    return NextResponse.json(
      { error: 'All early access spots have been claimed. Join our waitlist at support@guardscope.io' },
      { status: 410, headers: SECURITY_HEADERS }
    )
  }

  // Assign code
  const promoCode = await assignCodeToLead(name, email, country)
  if (!promoCode) {
    return NextResponse.json(
      { error: 'No promo codes available. Please try again in a moment.' },
      { status: 503, headers: SECURITY_HEADERS }
    )
  }

  // Send welcome email
  try {
    await sendWelcomeEmail({
      to: email,
      name,
      code: promoCode.code,
      claimDeadline: new Date(promoCode.claim_deadline),
    })
  } catch (err) {
    console.error('[promo/request] email send failed:', err)
    // Don't fail the request — code is assigned, email can be resent
  }

  return NextResponse.json(
    {
      success: true,
      message: 'Your promo code is on its way! Check your inbox (and spam folder) within 5 minutes.',
    },
    { headers: SECURITY_HEADERS }
  )
}

// Handle HTML form POST redirect
export async function GET() {
  return NextResponse.redirect(new URL('/#early-access', process.env.NEXT_PUBLIC_SITE_URL ?? '/'))
}

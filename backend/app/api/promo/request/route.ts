import { NextRequest, NextResponse } from 'next/server'
import { assignCodeToLead, getCodeForEmail, countRemainingCodes } from '../../../../lib/promo'
import { sendWelcomeEmail } from '../../../../lib/email'
import { checkRateLimit } from '../../../../lib/ratelimit'

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

// Input length limits — prevent oversized payloads
const MAX_NAME_LEN = 100
const MAX_EMAIL_LEN = 254  // RFC 5321 max email length
const MAX_COUNTRY_LEN = 100

export async function POST(req: NextRequest) {
  // Rate limit by IP — 3 requests per minute, 10 per day per IP
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ip = /^[0-9a-fA-F.:]{3,45}$/.test(rawIp) ? rawIp : 'unknown'
  const rateLimit = await checkRateLimit(`promo:${ip}`, false)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before trying again.' },
      { status: 429, headers: SECURITY_HEADERS }
    )
  }

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

  // Normalize and length-cap all string inputs
  const name    = typeof body.name    === 'string' ? body.name.trim().slice(0, MAX_NAME_LEN)    : ''
  const email   = typeof body.email   === 'string' ? body.email.trim().slice(0, MAX_EMAIL_LEN)  : ''
  const country = typeof body.country === 'string' ? body.country.trim().slice(0, MAX_COUNTRY_LEN) : ''

  // Validate inputs
  if (!name || name.length < 2) {
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
  if (!country) {
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

import { NextRequest, NextResponse } from 'next/server'
import { assignCodeToLead, getCodeForEmail, countRemainingCodes } from '../../../../lib/promo'
import { sendWelcomeEmail } from '../../../../lib/email'
import { checkRateLimit } from '../../../../lib/ratelimit'
import { buildCorsHeaders } from '../../../../lib/cors'

const STATIC_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
}

function getHeaders(req: NextRequest): Record<string, string> {
  return { ...STATIC_HEADERS, ...buildCorsHeaders(req) }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getHeaders(req) })
}

const MAX_NAME_LEN = 100
const MAX_EMAIL_LEN = 254
const MAX_COUNTRY_LEN = 100

export async function POST(req: NextRequest) {
  const securityHeaders = getHeaders(req)
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ip = /^[0-9a-fA-F.:]{3,45}$/.test(rawIp) ? rawIp : 'unknown'
  const rateLimit = await checkRateLimit(`promo:${ip}`, false)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before trying again.' },
      { status: 429, headers: securityHeaders }
    )
  }

  let body: { name?: string; email?: string; country?: string } = {}
  try {
    body = await req.json()
  } catch {
    try {
      const form = await req.formData()
      body = {
        name: form.get('name') as string,
        email: form.get('email') as string,
        country: form.get('country') as string,
      }
    } catch {
      body = {}
    }
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, MAX_NAME_LEN) : ''
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, MAX_EMAIL_LEN) : ''
  const country = typeof body.country === 'string' ? body.country.trim().slice(0, MAX_COUNTRY_LEN) : ''

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: 'Please provide your full name.' },
      { status: 400, headers: securityHeaders }
    )
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'Please provide a valid email address.' },
      { status: 400, headers: securityHeaders }
    )
  }
  if (!country) {
    return NextResponse.json(
      { error: 'Please enter your country.' },
      { status: 400, headers: securityHeaders }
    )
  }

  try {
    const existing = await getCodeForEmail(email)
    if (existing) {
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
        { success: true, message: 'We already sent you a code. Check your inbox and spam folder. We just resent it.' },
        { headers: securityHeaders }
      )
    }

    const remaining = await countRemainingCodes()
    if (remaining === 0) {
      return NextResponse.json(
        { error: 'All early access spots have been claimed. Join our waitlist at support@guardscope.app' },
        { status: 410, headers: securityHeaders }
      )
    }

    const promoCode = await assignCodeToLead(name, email, country)
    if (!promoCode) {
      return NextResponse.json(
        { error: 'No promo codes are available right now. Please try again in a moment.' },
        { status: 503, headers: securityHeaders }
      )
    }

    try {
      await sendWelcomeEmail({
        to: email,
        name,
        code: promoCode.code,
        claimDeadline: new Date(promoCode.claim_deadline),
      })
    } catch (err) {
      console.error('[promo/request] email send failed:', err)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Your promo code is on its way. Check your inbox and spam folder within 5 minutes.',
      },
      { headers: securityHeaders }
    )
  } catch (err) {
    console.error('[promo/request] database lookup failed:', err)
    return NextResponse.json(
      { error: 'Launch-code claims are temporarily unavailable while GuardScope reconnects to its secure database. Please try again shortly or email support@guardscope.app.' },
      { status: 503, headers: securityHeaders }
    )
  }
}

export async function GET() {
  return NextResponse.redirect(new URL('/#early-access', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guardscope.app'))
}

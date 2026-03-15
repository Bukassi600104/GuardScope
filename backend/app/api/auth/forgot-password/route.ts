import { NextRequest, NextResponse } from 'next/server'
import { buildCorsHeaders } from '../../../../lib/cors'
import { checkRateLimit } from '../../../../lib/ratelimit'

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) })
}

export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req)

  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const ip = /^[0-9a-fA-F.:]{3,45}$/.test(rawIp) ? rawIp : 'unknown'
  const rateResult = await checkRateLimit(`forgot-pw:${ip}`, false)
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: cors }
    )
  }

  let body: { email?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: cors })
  }

  const { email } = body
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400, headers: cors })
  }

  try {
    await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        gotrue_meta_security: {},
      }),
    })

    // Always return success — don't reveal whether the email exists
    return NextResponse.json({ success: true }, { headers: cors })
  } catch {
    return NextResponse.json({ error: 'Failed to send reset email — please try again' }, { status: 500, headers: cors })
  }
}

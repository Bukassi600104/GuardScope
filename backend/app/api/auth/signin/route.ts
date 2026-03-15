import { NextRequest, NextResponse } from 'next/server'
import { buildCorsHeaders } from '../../../../lib/cors'
import { checkRateLimit } from '../../../../lib/ratelimit'

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)!

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) })
}

export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req)

  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const ip = /^[0-9a-fA-F.:]{3,45}$/.test(rawIp) ? rawIp : 'unknown'
  const rateResult = await checkRateLimit(`signin:${ip}`, false)
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Too many sign-in attempts. Please try again later.' },
      { status: 429, headers: cors }
    )
  }

  let body: { email?: string; password?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: cors })
  }

  const { email, password } = body
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400, headers: cors })
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400, headers: cors })
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error_description?: string }
      const msg = data.error_description ?? 'Invalid email or password'
      return NextResponse.json({ error: msg }, { status: 401, headers: cors })
    }

    // Sign-in on website is just for verification — we don't return the token here
    // (extension sign-in goes through background.ts → Supabase directly)
    return NextResponse.json({ success: true }, { headers: cors })
  } catch {
    return NextResponse.json({ error: 'Network error — please try again' }, { status: 500, headers: cors })
  }
}

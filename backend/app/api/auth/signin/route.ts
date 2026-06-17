import { NextRequest, NextResponse } from 'next/server'
import { buildCorsHeaders, isAllowedExtensionRequest } from '../../../../lib/cors'
import { checkRateLimit } from '../../../../lib/ratelimit'
import { getUserTier } from '../../../../lib/quota'

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

  let body: { email?: string; password?: string; client?: string } = {}
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
  if (body.client === 'extension' && !isAllowedExtensionRequest(req)) {
    return NextResponse.json({ error: 'Extension sign-in is only available from the GuardScope extension.' }, { status: 403, headers: cors })
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
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401, headers: cors })
    }

    const data = await res.json() as {
      access_token: string
      refresh_token: string
      expires_in: number
      user: { id: string; email: string }
    }

    if (body.client === 'extension') {
      const tier = await getUserTier(data.user.id)
      return NextResponse.json({
        success: true,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        user: data.user,
        tier,
      }, { headers: cors })
    }

    return NextResponse.json({ success: true }, { headers: cors })
  } catch {
    return NextResponse.json({ error: 'Network error - please try again' }, { status: 500, headers: cors })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { isControlPanelOwnerEmail } from '../../../../lib/controlPanelAuth'
import { checkRateLimit } from '../../../../lib/ratelimit'

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').trim()
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '').trim()
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const ip = /^[0-9a-fA-F.:]{3,45}$/.test(rawIp) ? rawIp : 'unknown'
  const rateResult = await checkRateLimit(`control-panel:${ip}`, false)
  if (!rateResult.allowed) {
    return NextResponse.json({ error: 'Too many control panel sign-in attempts. Please try again later.' }, { status: 429 })
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Control Panel auth is not configured.' }, { status: 503 })
  }

  let body: { email?: string; password?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const email = body.email?.toLowerCase().trim() ?? ''
  const password = body.password ?? ''
  if (!EMAIL_REGEX.test(email) || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  if (!isControlPanelOwnerEmail(email)) {
    return NextResponse.json({ error: 'This account is not allowed to open the Control Panel.' }, { status: 403 })
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Invalid owner account credentials.' }, { status: 401 })
    }

    const data = await res.json() as {
      access_token?: string
      expires_in?: number
      user?: { email?: string }
    }

    if (!data.access_token || !isControlPanelOwnerEmail(data.user?.email ?? email)) {
      return NextResponse.json({ error: 'This account is not allowed to open the Control Panel.' }, { status: 403 })
    }

    return NextResponse.json({
      accessToken: data.access_token,
      expiresIn: data.expires_in ?? 3600,
      email,
    })
  } catch {
    return NextResponse.json({ error: 'Unable to reach Control Panel auth.' }, { status: 500 })
  }
}

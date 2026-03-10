import { NextRequest, NextResponse } from 'next/server'
import { buildCorsHeaders } from '../../../../lib/cors'
import { checkRateLimit } from '../../../../lib/ratelimit'

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!

// Service key is optional — if set, we use admin endpoint (auto-confirms email).
// If not set, we use the standard signup endpoint (sends confirmation email).
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) })
}

export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req)

  // Rate limit signups — 5 attempts per minute per IP to prevent mass account creation
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const ip = /^[0-9a-fA-F.:]{3,45}$/.test(rawIp) ? rawIp : 'unknown'
  const rateResult = await checkRateLimit(`signup:${ip}`, false)
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please try again later.' },
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
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400, headers: cors })
  }
  if (password.length > 72) {
    return NextResponse.json({ error: 'Password is too long' }, { status: 400, headers: cors })
  }

  try {
    if (SUPABASE_SERVICE_KEY) {
      // Admin path: auto-confirms email — no confirmation step for the user.
      const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          email_confirm: true,
        }),
      })

      const data = await res.json() as { id?: string; message?: string }

      if (!res.ok) {
        const msg = data.message ?? 'Registration failed'
        if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists') || res.status === 422) {
          return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409, headers: cors })
        }
        return NextResponse.json({ error: msg }, { status: 400, headers: cors })
      }

      return NextResponse.json({ success: true }, { headers: cors })
    }

    // Standard path: uses anon key — Supabase sends a confirmation email.
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        password,
      }),
    })

    const data = await res.json() as { id?: string; error?: string; msg?: string; message?: string }

    if (!res.ok) {
      const msg = data.error ?? data.msg ?? data.message ?? 'Registration failed'
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists') || res.status === 422) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409, headers: cors })
      }
      return NextResponse.json({ error: msg }, { status: 400, headers: cors })
    }

    // If email confirmation is disabled in Supabase dashboard, user is ready immediately.
    // If enabled, they'll get a confirmation email — signal this to the frontend.
    const needsConfirmation = !data.id
    return NextResponse.json({ success: true, needsConfirmation }, { headers: cors })

  } catch {
    return NextResponse.json({ error: 'Registration failed — please try again' }, { status: 500, headers: cors })
  }
}

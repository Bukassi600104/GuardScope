import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!

// Service key is optional — if set, we use admin endpoint (auto-confirms email).
// If not set, we use the standard signup endpoint (sends confirmation email).
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: CORS })
  }

  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400, headers: CORS })
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400, headers: CORS })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400, headers: CORS })
  }
  if (password.length > 72) {
    return NextResponse.json({ error: 'Password is too long' }, { status: 400, headers: CORS })
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
          return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409, headers: CORS })
        }
        return NextResponse.json({ error: msg }, { status: 400, headers: CORS })
      }

      return NextResponse.json({ success: true }, { headers: CORS })
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
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409, headers: CORS })
      }
      return NextResponse.json({ error: msg }, { status: 400, headers: CORS })
    }

    // If email confirmation is disabled in Supabase dashboard, user is ready immediately.
    // If enabled, they'll get a confirmation email — signal this to the frontend.
    const needsConfirmation = !data.id
    return NextResponse.json({ success: true, needsConfirmation }, { headers: CORS })

  } catch (err) {
    console.error('[auth/signup] error:', err)
    return NextResponse.json({ error: 'Registration failed — please try again' }, { status: 500, headers: CORS })
  }
}

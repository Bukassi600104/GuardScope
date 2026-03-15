import { NextRequest, NextResponse } from 'next/server'
import { buildCorsHeaders } from '../../../../lib/cors'

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)!

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) })
}

export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req)

  let body: { access_token?: string; password?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: cors })
  }

  const { access_token, password } = body
  if (!access_token || !password) {
    return NextResponse.json({ error: 'access_token and password are required' }, { status: 400, headers: cors })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400, headers: cors })
  }
  if (password.length > 72) {
    return NextResponse.json({ error: 'Password is too long' }, { status: 400, headers: cors })
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({ password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { msg?: string; message?: string }
      return NextResponse.json(
        { error: data.msg ?? data.message ?? 'Reset failed — your link may have expired' },
        { status: 400, headers: cors }
      )
    }

    return NextResponse.json({ success: true }, { headers: cors })
  } catch {
    return NextResponse.json({ error: 'Network error — please try again' }, { status: 500, headers: cors })
  }
}

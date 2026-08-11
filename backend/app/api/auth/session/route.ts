import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_COOKIE, REFRESH_COOKIE, authCookieOptions } from '../../../../lib/requestAuth'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? ''

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value
  if (!refreshToken || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Session unavailable' }, { status: 401 })
  }

  try {
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
    })
    if (!authRes.ok) {
      const response = NextResponse.json({ error: 'Session expired' }, { status: 401 })
      response.cookies.delete(ACCESS_COOKIE)
      response.cookies.delete(REFRESH_COOKIE)
      return response
    }

    const session = await authRes.json() as {
      access_token: string
      refresh_token: string
      expires_in?: number
    }
    const response = NextResponse.json({ success: true })
    response.cookies.set(ACCESS_COOKIE, session.access_token, {
      ...authCookieOptions,
      maxAge: session.expires_in ?? 3600,
    })
    response.cookies.set(REFRESH_COOKIE, session.refresh_token, {
      ...authCookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Session refresh unavailable' }, { status: 503 })
  }
}

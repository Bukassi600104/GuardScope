import { NextRequest, NextResponse } from 'next/server'
import { buildCorsHeaders, isAllowedExtensionRequest } from '../../../../lib/cors'
import { checkRateLimit } from '../../../../lib/ratelimit'
import { getUserTier } from '../../../../lib/quota'
import { getAccountStatus } from '../../../../lib/access'

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)!

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) })
}

export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req)
  if (!isAllowedExtensionRequest(req)) {
    return NextResponse.json({ error: 'Session refresh is only available from the GuardScope extension.' }, { status: 403, headers: cors })
  }

  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const ip = /^[0-9a-fA-F.:]{3,45}$/.test(rawIp) ? rawIp : 'unknown'
  const rateResult = await checkRateLimit(`authrefresh:${ip}`, false)
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Too many session refresh attempts. Please sign in again shortly.' },
      { status: 429, headers: cors }
    )
  }

  let body: { refresh_token?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: cors })
  }

  if (!body.refresh_token || typeof body.refresh_token !== 'string') {
    return NextResponse.json({ error: 'Refresh token is required' }, { status: 400, headers: cors })
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ refresh_token: body.refresh_token }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401, headers: cors })
    }

    const data = await res.json() as {
      access_token: string
      refresh_token: string
      expires_in: number
      user: { id: string; email: string }
    }

    const tier = await getUserTier(data.user.id)
    const account = await getAccountStatus(data.user.id)
    return NextResponse.json({
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      user: data.user,
      tier,
      account,
    }, { headers: cors })
  } catch {
    return NextResponse.json({ error: 'Network error - please try again' }, { status: 500, headers: cors })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { decodeJwt, getUserTier } from '../../../lib/quota'

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY)!

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: SECURITY_HEADERS })
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const jwtPayload = token ? await decodeJwt(token) : null

  if (!jwtPayload?.sub) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401, headers: SECURITY_HEADERS })
  }

  const userId = jwtPayload.sub
  const tier = await getUserTier(userId)

  // History available for all tiers, but limit for free
  const limit = tier === 'pro' || tier === 'team' ? 30 : 10

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/analysis_history?user_id=eq.${userId}&order=analyzed_at.desc&limit=${limit}&select=id,from_domain,risk_level,risk_score,analysis_path,duration_ms,analyzed_at`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500, headers: SECURITY_HEADERS })
    }

    const history = await res.json()
    return NextResponse.json({ history, tier, limit }, { headers: SECURITY_HEADERS })
  } catch (err) {
    console.error('[history] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: SECURITY_HEADERS })
  }
}

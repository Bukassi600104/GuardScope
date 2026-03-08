import { NextRequest, NextResponse } from 'next/server'
import { decodeJwt, getUserTier } from '../../../lib/quota'

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY)!

const TIER_LIMITS: Record<string, number | null> = {
  free: 5,
  pro: null,   // unlimited
  team: null,  // unlimited
}

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
  const now = new Date()
  const month = now.getUTCMonth() + 1
  const year = now.getUTCFullYear()

  try {
    const [tierRes, usageRes] = await Promise.all([
      getUserTier(userId),
      fetch(`${SUPABASE_URL}/rest/v1/usage?user_id=eq.${userId}&month=eq.${month}&year=eq.${year}&select=analysis_count`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }),
    ])

    const tier = tierRes
    const usageData = await usageRes.json() as Array<{ analysis_count: number }>
    const count = usageData[0]?.analysis_count ?? 0
    const limit = TIER_LIMITS[tier] ?? 5

    return NextResponse.json({ count, limit, tier, month, year }, { headers: SECURITY_HEADERS })
  } catch (err) {
    console.error('[usage] error:', err)
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500, headers: SECURITY_HEADERS })
  }
}

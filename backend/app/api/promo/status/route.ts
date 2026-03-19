import { NextRequest, NextResponse } from 'next/server'
import { buildCorsHeaders } from '../../../../lib/cors'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) })
}

export async function GET(req: NextRequest) {
  const cors = buildCorsHeaders(req)
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/promo_codes?status=eq.unused&claim_deadline=gt.${new Date().toISOString()}&select=id`,
      {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Prefer': 'count=exact',
          'Range': '0-0',
        },
      }
    )
    // Content-Range: 0-0/N — N is total count
    const range = res.headers.get('content-range') ?? ''
    const total = parseInt(range.split('/')[1] ?? '0', 10)
    return NextResponse.json({ available: total > 0, remaining: total }, { headers: cors })
  } catch {
    // On error default to available=true so we don't hide the promo option
    return NextResponse.json({ available: true, remaining: -1 }, { headers: cors })
  }
}

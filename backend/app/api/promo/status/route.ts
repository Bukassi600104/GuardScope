import { NextRequest, NextResponse } from 'next/server'
import { buildCorsHeaders } from '../../../../lib/cors'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''
const STATIC_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
}

function getHeaders(req: NextRequest): Record<string, string> {
  return { ...STATIC_HEADERS, ...buildCorsHeaders(req, 'GET, OPTIONS') }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getHeaders(req) })
}

export async function GET(req: NextRequest) {
  const headers = getHeaders(req)
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/promo_codes?status=eq.unused&requester_email=is.null&claim_deadline=gt.${encodeURIComponent(new Date().toISOString())}&select=id`,
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
    return NextResponse.json({ available: total > 0, remaining: total }, { headers })
  } catch {
    // On error default to available=true so we don't hide the promo option
    return NextResponse.json({ available: true, remaining: -1 }, { headers })
  }
}

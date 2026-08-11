import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '../../../../lib/requestAuth'
import { getAccountStatus } from '../../../../lib/access'
import { buildCorsHeaders } from '../../../../lib/cors'

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req, 'GET, OPTIONS') })
}

export async function GET(req: NextRequest) {
  const headers = buildCorsHeaders(req, 'GET, OPTIONS')
  const auth = await authenticateRequest(req)
  if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401, headers })

  const status = await getAccountStatus(auth.userId)
  if (!status) return NextResponse.json({ error: 'Account status unavailable' }, { status: 503, headers })

  return NextResponse.json(status, {
    headers: { ...headers, 'Cache-Control': 'no-store, max-age=0' },
  })
}

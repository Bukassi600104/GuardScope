import { NextRequest, NextResponse } from 'next/server'
import { getAccountStatus } from '../../../lib/access'
import { buildCorsHeaders } from '../../../lib/cors'
import { authenticateRequest } from '../../../lib/requestAuth'

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req, 'GET, OPTIONS') })
}

export async function GET(req: NextRequest) {
  const headers = buildCorsHeaders(req, 'GET, OPTIONS')
  const auth = await authenticateRequest(req)
  if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401, headers })
  const account = await getAccountStatus(auth.userId)
  if (!account) return NextResponse.json({ error: 'Account status unavailable' }, { status: 503, headers })

  return NextResponse.json({
    count: account.trialScansUsed,
    limit: account.accessPlan === 'trial' ? account.trialScanLimit : null,
    tier: account.accessPlan === 'trial' ? 'free' : account.accessPlan,
    account,
  }, { headers: { ...headers, 'Cache-Control': 'no-store, max-age=0' } })
}

import { NextRequest, NextResponse } from 'next/server'
import { buildCorsHeaders } from '../../../lib/cors'

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) })
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error: 'payments_suspended',
      message: 'Subscription checkout is not active yet. Your account and trial remain available.',
    },
    { status: 503, headers: buildCorsHeaders(req) }
  )
}

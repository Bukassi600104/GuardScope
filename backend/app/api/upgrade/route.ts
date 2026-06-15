import { NextRequest, NextResponse } from 'next/server'
import { buildCorsHeaders } from '../../../lib/cors'

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) })
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error: 'payments_suspended',
      message: 'Payments are not yet active. Use your promo code to access Pro.',
    },
    { status: 503, headers: buildCorsHeaders(req) }
  )
}

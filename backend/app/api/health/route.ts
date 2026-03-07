import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      service: 'guardscope-api',
      checks: {
        ai_engine: 'mercury-2',
        threat_intel: ['virustotal', 'safe_browsing', 'phishtank', 'urlhaus'],
      },
    },
    { status: 200 }
  )
}

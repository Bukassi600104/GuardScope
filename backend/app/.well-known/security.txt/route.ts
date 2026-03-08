import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

export async function GET() {
  const body = [
    'Contact: mailto:security@guardscope.io',
    'Expires: 2027-03-08T00:00:00.000Z',
    'Preferred-Languages: en',
    'Canonical: https://backend-gules-sigma-37.vercel.app/.well-known/security.txt',
    'Policy: https://backend-gules-sigma-37.vercel.app/privacy',
  ].join('\n')

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

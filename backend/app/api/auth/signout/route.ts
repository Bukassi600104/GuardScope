import { NextResponse } from 'next/server'
import { ACCESS_COOKIE, REFRESH_COOKIE, authCookieOptions } from '../../../../lib/requestAuth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(ACCESS_COOKIE, '', { ...authCookieOptions, maxAge: 0 })
  response.cookies.set(REFRESH_COOKIE, '', { ...authCookieOptions, maxAge: 0 })
  return response
}

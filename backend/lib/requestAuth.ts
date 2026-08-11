import type { NextRequest } from 'next/server'
import { authenticateAccessToken } from './access'

export const ACCESS_COOKIE = 'guardscope_access_token'
export const REFRESH_COOKIE = 'guardscope_refresh_token'

export function getRequestToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization') ?? ''
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7)
  return req.cookies.get(ACCESS_COOKIE)?.value ?? null
}

export async function authenticateRequest(req: NextRequest) {
  return authenticateAccessToken(getRequestToken(req))
}

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

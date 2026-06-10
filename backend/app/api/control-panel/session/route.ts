import { NextRequest, NextResponse } from 'next/server'
import {
  createControlPanelSession,
  getStoredControlPanelCredential,
  verifyOwnerPassword,
} from '../../../../lib/controlPanelPassword'
import { checkRateLimit } from '../../../../lib/ratelimit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const ip = /^[0-9a-fA-F.:]{3,45}$/.test(rawIp) ? rawIp : 'unknown'
  const rateResult = await checkRateLimit(`control-panel:${ip}`, false)
  if (!rateResult.allowed) {
    return NextResponse.json({ error: 'Too many control panel sign-in attempts. Please try again later.' }, { status: 429 })
  }

  let body: { username?: string; password?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const username = body.username?.trim() ?? ''
  const password = body.password ?? ''
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 })
  }

  try {
    const credential = await getStoredControlPanelCredential()
    if (!credential) {
      return NextResponse.json({ error: 'Control Panel owner has not been created yet.', setupRequired: true }, { status: 409 })
    }

    const usernameMatches = credential.username.toLowerCase() === username.toLowerCase()
    const passwordMatches = await verifyOwnerPassword(password, credential.password_hash)
    if (!usernameMatches || !passwordMatches) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 })
    }

    return NextResponse.json({
      accessToken: createControlPanelSession(credential.username),
      username: credential.username,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to reach Control Panel auth.' },
      { status: 500 }
    )
  }
}

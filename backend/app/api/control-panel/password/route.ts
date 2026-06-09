import { NextRequest, NextResponse } from 'next/server'
import { isControlPanelOwnerEmail } from '../../../../lib/controlPanelAuth'
import {
  createControlPanelSession,
  saveControlPanelPassword,
  validateNewOwnerPassword,
  verifyControlPanelSetupToken,
} from '../../../../lib/controlPanelPassword'
import { checkRateLimit } from '../../../../lib/ratelimit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const ip = /^[0-9a-fA-F.:]{3,45}$/.test(rawIp) ? rawIp : 'unknown'
  const rateResult = await checkRateLimit(`control-panel-change:${ip}`, false)
  if (!rateResult.allowed) {
    return NextResponse.json({ error: 'Too many password change attempts. Please try again later.' }, { status: 429 })
  }

  let body: { setupToken?: string; password?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const setup = body.setupToken ? verifyControlPanelSetupToken(body.setupToken) : null
  if (!setup || !isControlPanelOwnerEmail(setup.email)) {
    return NextResponse.json({ error: 'Temporary owner session expired. Sign in with the temporary password again.' }, { status: 401 })
  }

  const password = body.password ?? ''
  const passwordError = validateNewOwnerPassword(password)
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 })
  }

  try {
    await saveControlPanelPassword(password)
    return NextResponse.json({
      accessToken: createControlPanelSession(setup.email),
      email: setup.email,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save Control Panel password.' },
      { status: 500 }
    )
  }
}

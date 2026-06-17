import { NextRequest, NextResponse } from 'next/server'
import {
  getStoredControlPanelCredential,
  isControlPanelSetupTokenRequired,
  saveControlPanelCredential,
  validateNewOwnerPassword,
  validateOwnerUsername,
  validateRecoveryEmail,
  verifyControlPanelSetupToken,
} from '../../../../lib/controlPanelPassword'
import { checkRateLimit } from '../../../../lib/ratelimit'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const credential = await getStoredControlPanelCredential()
    return NextResponse.json({
      configured: Boolean(credential),
      setupTokenRequired: !credential && isControlPanelSetupTokenRequired(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to read Control Panel setup status.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const ip = /^[0-9a-fA-F.:]{3,45}$/.test(rawIp) ? rawIp : 'unknown'
  const rateResult = await checkRateLimit(`control-panel-setup:${ip}`, false)
  if (!rateResult.allowed) {
    return NextResponse.json({ error: 'Too many setup attempts. Please try again later.' }, { status: 429 })
  }

  try {
    const existing = await getStoredControlPanelCredential()
    if (existing) {
      return NextResponse.json({ error: 'Control Panel owner already exists.' }, { status: 409 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to read Control Panel setup status.' },
      { status: 500 }
    )
  }

  let body: { username?: string; password?: string; recoveryEmail?: string; setupToken?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const username = body.username?.trim() ?? ''
  const password = body.password ?? ''
  const recoveryEmail = body.recoveryEmail?.trim().toLowerCase() ?? ''
  const setupToken = body.setupToken ?? ''

  if (!verifyControlPanelSetupToken(setupToken)) {
    return NextResponse.json(
      { error: 'Control Panel owner setup is locked. Provide the production owner setup token.' },
      { status: 403 }
    )
  }

  const usernameError = validateOwnerUsername(username)
  if (usernameError) return NextResponse.json({ error: usernameError }, { status: 400 })

  const passwordError = validateNewOwnerPassword(password)
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 })

  const emailError = validateRecoveryEmail(recoveryEmail)
  if (emailError) return NextResponse.json({ error: emailError }, { status: 400 })

  try {
    await saveControlPanelCredential({ username, password, recoveryEmail })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create Control Panel owner.' },
      { status: 500 }
    )
  }
}

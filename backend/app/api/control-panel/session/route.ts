import { NextRequest, NextResponse } from 'next/server'
import { isControlPanelOwnerEmail } from '../../../../lib/controlPanelAuth'
import {
  createControlPanelSession,
  createControlPanelSetupSession,
  getStoredControlPanelCredential,
  verifyBootstrapPassword,
  verifyOwnerPassword,
} from '../../../../lib/controlPanelPassword'
import { checkRateLimit } from '../../../../lib/ratelimit'

const OWNER_EMAIL = (process.env.CONTROL_PANEL_OWNER_EMAILS ?? process.env.ADMIN_EMAILS ?? 'bukassi@gmail.com')
  .split(',')[0]
  .trim()
  .toLowerCase()
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const ip = /^[0-9a-fA-F.:]{3,45}$/.test(rawIp) ? rawIp : 'unknown'
  const rateResult = await checkRateLimit(`control-panel:${ip}`, false)
  if (!rateResult.allowed) {
    return NextResponse.json({ error: 'Too many control panel sign-in attempts. Please try again later.' }, { status: 429 })
  }

  let body: { email?: string; password?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const email = (body.email?.toLowerCase().trim() || OWNER_EMAIL)
  const password = body.password ?? ''
  if (!EMAIL_REGEX.test(email) || !password) {
    return NextResponse.json({ error: 'Owner password is required.' }, { status: 400 })
  }

  if (!isControlPanelOwnerEmail(email)) {
    return NextResponse.json({ error: 'This account is not allowed to open the Control Panel.' }, { status: 403 })
  }

  try {
    const storedCredential = await getStoredControlPanelCredential()
    if (storedCredential) {
      const valid = await verifyOwnerPassword(password, storedCredential.password_hash)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid owner password.' }, { status: 401 })
      }

      return NextResponse.json({
        accessToken: createControlPanelSession(email),
        requiresPasswordChange: false,
        email,
      })
    }

    const bootstrapValid = await verifyBootstrapPassword(password)
    if (!bootstrapValid) {
      return NextResponse.json({ error: 'Invalid temporary owner password.' }, { status: 401 })
    }

    return NextResponse.json({
      setupToken: createControlPanelSetupSession(email),
      requiresPasswordChange: true,
      email,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to reach Control Panel auth.' },
      { status: 500 }
    )
  }
}

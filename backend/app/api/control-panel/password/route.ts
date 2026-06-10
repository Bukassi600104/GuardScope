import { NextRequest, NextResponse } from 'next/server'
import {
  getStoredControlPanelCredential,
  saveControlPanelPassword,
  validateNewOwnerPassword,
  verifyControlPanelResetToken,
} from '../../../../lib/controlPanelPassword'
import { checkRateLimit } from '../../../../lib/ratelimit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const ip = /^[0-9a-fA-F.:]{3,45}$/.test(rawIp) ? rawIp : 'unknown'
  const rateResult = await checkRateLimit(`control-panel-reset:${ip}`, false)
  if (!rateResult.allowed) {
    return NextResponse.json({ error: 'Too many password reset attempts. Please try again later.' }, { status: 429 })
  }

  let body: { token?: string; password?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const password = body.password ?? ''
  const passwordError = validateNewOwnerPassword(password)
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 })
  }

  try {
    const credential = await getStoredControlPanelCredential()
    if (!credential) {
      return NextResponse.json({ error: 'Control Panel owner has not been created yet.' }, { status: 409 })
    }

    const reset = body.token ? verifyControlPanelResetToken(body.token, credential) : null
    if (!reset) {
      return NextResponse.json({ error: 'Password reset link is invalid or expired.' }, { status: 401 })
    }

    await saveControlPanelPassword(password)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save Control Panel password.' },
      { status: 500 }
    )
  }
}

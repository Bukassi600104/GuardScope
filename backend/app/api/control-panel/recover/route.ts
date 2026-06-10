import { NextRequest, NextResponse } from 'next/server'
import { createControlPanelResetToken, getStoredControlPanelCredential } from '../../../../lib/controlPanelPassword'
import { sendControlPanelRecoveryEmail } from '../../../../lib/email'
import { checkRateLimit } from '../../../../lib/ratelimit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const ip = /^[0-9a-fA-F.:]{3,45}$/.test(rawIp) ? rawIp : 'unknown'
  const rateResult = await checkRateLimit(`control-panel-recover:${ip}`, false)
  if (!rateResult.allowed) {
    return NextResponse.json({ error: 'Too many recovery attempts. Please try again later.' }, { status: 429 })
  }

  let body: { username?: string; recoveryEmail?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  try {
    const credential = await getStoredControlPanelCredential()
    const usernameMatches = credential && body.username?.trim().toLowerCase() === credential.username.toLowerCase()
    const emailMatches = credential && body.recoveryEmail?.trim().toLowerCase() === credential.recovery_email.toLowerCase()

    if (credential && usernameMatches && emailMatches) {
      const token = createControlPanelResetToken(credential)
      await sendControlPanelRecoveryEmail({
        to: credential.recovery_email,
        username: credential.username,
        resetUrl: `https://guardscope.app/control-panel?reset=${encodeURIComponent(token)}`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to start password recovery.' },
      { status: 500 }
    )
  }
}

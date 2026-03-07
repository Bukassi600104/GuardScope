import { NextRequest, NextResponse } from 'next/server'
import { decodeJwt } from '../../../../lib/quota'
import * as crypto from 'crypto'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://backend-gules-sigma-37.vercel.app'

// NGN pricing: Pro = ₦7,500/month
const PAYSTACK_PRO_AMOUNT_KOBO = 750_000 // Paystack uses kobo (₦ × 100)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const jwtPayload = token ? decodeJwt(token) : null

  if (!jwtPayload?.sub || !jwtPayload?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  if (!PAYSTACK_SECRET) {
    return NextResponse.json({ error: 'Paystack not configured' }, { status: 503 })
  }

  // Generate idempotency reference
  const reference = `gs_pro_${jwtPayload.sub}_${Date.now()}`

  try {
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: jwtPayload.email,
        amount: PAYSTACK_PRO_AMOUNT_KOBO,
        currency: 'NGN',
        reference,
        callback_url: `${SITE_URL}/?checkout=success`,
        metadata: {
          userId: jwtPayload.sub,
          plan: 'pro',
          cancel_action: `${SITE_URL}/?checkout=cancelled`,
        },
        plan: process.env.PAYSTACK_PRO_PLAN_CODE, // recurring plan code
      }),
    })

    const data = await res.json() as { status: boolean; data?: { authorization_url: string } }
    if (!data.status || !data.data) {
      return NextResponse.json({ error: 'Paystack initialization failed' }, { status: 500 })
    }

    return NextResponse.json({ url: data.data.authorization_url, reference })
  } catch (err) {
    console.error('[paystack/initialize] error:', err)
    return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 })
  }
}

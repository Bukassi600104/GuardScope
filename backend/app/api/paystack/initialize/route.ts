import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getPaystackReadiness } from '../../../../lib/access'
import { authenticateRequest } from '../../../../lib/requestAuth'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guardscope.app'

export async function POST(req: NextRequest) {
  if (!getPaystackReadiness().ready) {
    return NextResponse.json(
      { error: 'billing_not_configured', message: 'Subscription checkout is being prepared. Your account and trial remain available.' },
      { status: 503 }
    )
  }

  const auth = await authenticateRequest(req)
  if (!auth?.userId || !auth.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: { interval?: 'monthly' | 'annual' } = {}
  try { body = await req.json() } catch { /* defaults to monthly */ }
  const interval = body.interval === 'annual' ? 'annual' : 'monthly'
  const planCode = interval === 'annual'
    ? process.env.PAYSTACK_PRO_ANNUAL_PLAN_CODE
    : (process.env.PAYSTACK_PRO_MONTHLY_PLAN_CODE ?? process.env.PAYSTACK_PRO_PLAN_CODE)
  if (!planCode) return NextResponse.json({ error: 'Selected billing plan is not configured' }, { status: 503 })

  const reference = `gs_${interval}_${auth.userId}_${randomUUID()}`
  try {
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: auth.email,
        currency: 'NGN',
        reference,
        callback_url: `${SITE_URL}/account?payment=return`,
        metadata: {
          userId: auth.userId,
          plan: 'pro',
          interval,
          cancel_action: `${SITE_URL}/account?payment=cancelled`,
        },
        plan: planCode,
      }),
    })

    const data = await res.json() as { status: boolean; message?: string; data?: { authorization_url: string } }
    if (!res.ok || !data.status || !data.data) {
      return NextResponse.json({ error: data.message ?? 'Paystack initialization failed' }, { status: 502 })
    }
    return NextResponse.json({ url: data.data.authorization_url, reference, interval })
  } catch (error) {
    console.error('[paystack/initialize] error:', error)
    return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 })
  }
}

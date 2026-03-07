import { NextRequest, NextResponse } from 'next/server'
import * as crypto from 'crypto'
import * as Sentry from '@sentry/nextjs'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function updateUserTier(userId: string, tier: 'free' | 'pro', paystackCustomerCode?: string) {
  const patch: Record<string, unknown> = { tier }
  if (paystackCustomerCode) patch.paystack_customer_code = paystackCustomerCode

  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(patch),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase PATCH failed: ${res.status} ${text}`)
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-paystack-signature')

  if (!signature || !PAYSTACK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify HMAC-SHA512 signature
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex')
  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: { event: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    switch (event.event) {
      case 'charge.success': {
        const data = event.data
        const metadata = data.metadata as Record<string, string> | undefined
        const userId = metadata?.userId
        if (!userId) break

        const customerCode = (data.customer as Record<string, string>)?.customer_code
        await updateUserTier(userId, 'pro', customerCode)
        console.log(`[paystack] User ${userId} upgraded to pro`)
        break
      }

      case 'subscription.disable': {
        const data = event.data
        const metadata = (data.subscription as Record<string, unknown>)?.metadata as Record<string, string> | undefined
        const userId = metadata?.userId
        if (!userId) break

        await updateUserTier(userId, 'free')
        console.log(`[paystack] User ${userId} subscription disabled — reverted to free`)
        break
      }

      case 'invoice.payment_failed': {
        const data = event.data
        console.warn('[paystack] Payment failed for customer:', (data.customer as Record<string, string>)?.email)
        break
      }
    }
  } catch (err) {
    Sentry.captureException(err, { extra: { eventType: event.event } })
    console.error(`[paystack/webhook] handler error for ${event.event}:`, err)
    // Return 200 — Paystack retries on non-200; we log instead
  }

  return NextResponse.json({ received: true })
}

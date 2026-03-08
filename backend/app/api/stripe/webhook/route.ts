import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '../../../../lib/stripe'
import * as Sentry from '@sentry/nextjs'

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL) ?? ''
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY) ?? ''

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
function isValidUUID(id: string | undefined): id is string {
  return !!id && UUID_RE.test(id)
}

async function updateUserTier(userId: string, tier: 'free' | 'pro', stripeCustomerId?: string, stripeSubscriptionId?: string) {
  const patch: Record<string, unknown> = { tier }
  if (stripeCustomerId) patch.stripe_customer_id = stripeCustomerId
  if (stripeSubscriptionId) patch.stripe_subscription_id = stripeSubscriptionId

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
    const body = await res.text()
    throw new Error(`Supabase update failed: ${res.status} ${body}`)
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (!isValidUUID(userId)) break
        await updateUserTier(
          userId,
          'pro',
          session.customer as string,
          session.subscription as string
        )
        console.log(`[stripe] User ${userId} upgraded to pro`)
        break
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        if (!isValidUUID(userId)) break
        await updateUserTier(userId, 'free')
        console.log(`[stripe] User ${userId} reverted to free (${event.type})`)
        break
      }

      case 'invoice.payment_failed': {
        // Log but don't immediately downgrade — Stripe retries for several days
        const invoice = event.data.object as Stripe.Invoice
        console.warn(`[stripe] Payment failed for customer ${invoice.customer}`)
        Sentry.captureMessage(`Stripe payment failed: ${invoice.customer}`, 'warning')
        break
      }
    }
  } catch (err) {
    Sentry.captureException(err, { extra: { eventType: event.type } })
    console.error(`[stripe/webhook] handler error for ${event.type}:`, err)
    // Return 200 so Stripe doesn't retry — we log + alert instead
  }

  return NextResponse.json({ received: true })
}

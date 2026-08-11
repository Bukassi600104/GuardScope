import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
type JsonRecord = Record<string, unknown>

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' ? value as JsonRecord : {}
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

async function findUserId(data: JsonRecord): Promise<string | null> {
  const metadata = record(data.metadata)
  const directUserId = text(metadata.userId)
  if (directUserId && UUID_RE.test(directUserId)) return directUserId

  const subscription = record(data.subscription)
  const customer = record(data.customer)
  const subscriptionCode = text(data.subscription_code) ?? text(subscription.subscription_code)
  const email = text(customer.email) ?? text(metadata.email)
  const filter = subscriptionCode
    ? `paystack_subscription_code=eq.${encodeURIComponent(subscriptionCode)}`
    : email ? `email=eq.${encodeURIComponent(email.toLowerCase())}` : null
  if (!filter) return null

  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?${filter}&select=id&limit=1`, {
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Unable to resolve webhook account (${res.status})`)
  const rows = await res.json() as Array<{ id: string }>
  return rows[0]?.id ?? null
}

async function patchUser(userId: string, patch: JsonRecord) {
  const sanitized = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined))
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, Prefer: 'return=minimal',
    },
    body: JSON.stringify({ ...sanitized, payment_provider: 'paystack', billing_updated_at: new Date().toISOString() }),
  })
  if (!res.ok) throw new Error(`Unable to update subscription state (${res.status}): ${await res.text()}`)
}

async function registerEvent(eventKey: string, eventType: string, payloadSha256: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/payment_webhook_events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, Prefer: 'return=minimal',
    },
    body: JSON.stringify({ provider: 'paystack', event_key: eventKey, event_type: eventType, payload_sha256: payloadSha256 }),
  })
  if (res.ok) return 'new'
  if (res.status !== 409) return 'unavailable'

  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/payment_webhook_events?provider=eq.paystack&event_key=eq.${encodeURIComponent(eventKey)}&select=processing_status&limit=1`,
    { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }, cache: 'no-store' },
  )
  const rows = existingRes.ok ? await existingRes.json() as Array<{ processing_status: string }> : []
  if (rows[0]?.processing_status !== 'failed') return 'duplicate'

  const retryRes = await fetch(
    `${SUPABASE_URL}/rest/v1/payment_webhook_events?provider=eq.paystack&event_key=eq.${encodeURIComponent(eventKey)}&processing_status=eq.failed`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, Prefer: 'return=minimal',
      },
      body: JSON.stringify({ processing_status: 'received', processed_at: null, error_message: null }),
    },
  )
  return retryRes.ok ? 'retry' : 'unavailable'
}

async function finishEvent(eventKey: string, status: 'processed' | 'ignored' | 'failed', errorMessage?: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/payment_webhook_events?provider=eq.paystack&event_key=eq.${encodeURIComponent(eventKey)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, Prefer: 'return=minimal',
    },
    body: JSON.stringify({ processing_status: status, processed_at: new Date().toISOString(), error_message: errorMessage ?? null }),
  })
}

export async function POST(req: NextRequest) {
  if (!PAYSTACK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const body = await req.text()
  const signature = req.headers.get('x-paystack-signature') ?? ''
  const expected = createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  const signatureBuffer = Buffer.from(signature, 'hex')
  if (!signature || expectedBuffer.length !== signatureBuffer.length || !timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: { event: string; data: JsonRecord }
  try { event = JSON.parse(body) as { event: string; data: JsonRecord } }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const payloadHash = createHash('sha256').update(body).digest('hex')
  const eventKey = `${event.event}:${payloadHash}`
  const registration = await registerEvent(eventKey, event.event, payloadHash)
  if (registration === 'duplicate') return NextResponse.json({ received: true, duplicate: true })
  if (registration === 'unavailable') return NextResponse.json({ error: 'Webhook storage unavailable' }, { status: 503 })

  try {
    const data = event.data
    const subscription = record(data.subscription)
    const customer = record(data.customer)
    const plan = record(data.plan)
    const userId = await findUserId(data)
    if (!userId) {
      await finishEvent(eventKey, 'ignored')
      return NextResponse.json({ received: true, matched: false })
    }

    const subscriptionCode = text(data.subscription_code) ?? text(subscription.subscription_code)
    const customerCode = text(data.customer_code) ?? text(customer.customer_code)
    const planCode = text(data.plan_code) ?? text(plan.plan_code)
    const nextPaymentAt = text(data.next_payment_date) ?? text(subscription.next_payment_date)

    switch (event.event) {
      case 'subscription.create':
      case 'charge.success':
      case 'invoice.update':
        await patchUser(userId, {
          tier: 'pro', access_plan: 'pro', subscription_status: 'active', pro_expires_at: null,
          paystack_customer_code: customerCode, paystack_subscription_code: subscriptionCode,
          paystack_plan_code: planCode, next_payment_at: nextPaymentAt,
          last_payment_at: event.event === 'charge.success' || data.paid === true ? new Date().toISOString() : undefined,
          last_payment_failed_at: null, cancel_at_period_end: false,
        })
        break
      case 'invoice.payment_failed':
        await patchUser(userId, { subscription_status: 'attention', last_payment_failed_at: new Date().toISOString() })
        break
      case 'subscription.not_renew':
        await patchUser(userId, { subscription_status: 'non_renewing', cancel_at_period_end: true, next_payment_at: nextPaymentAt })
        break
      case 'subscription.disable':
        await patchUser(userId, { tier: 'free', access_plan: 'pro', subscription_status: 'canceled', cancel_at_period_end: false, next_payment_at: null })
        break
      default:
        await finishEvent(eventKey, 'ignored')
        return NextResponse.json({ received: true, ignored: true })
    }

    await finishEvent(eventKey, 'processed')
    return NextResponse.json({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown webhook error'
    await finishEvent(eventKey, 'failed', message.slice(0, 500))
    Sentry.captureException(error, { extra: { eventType: event.event } })
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

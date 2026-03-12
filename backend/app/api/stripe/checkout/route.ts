import { NextRequest, NextResponse } from 'next/server'
import { getStripe, STRIPE_PRICES } from '../../../../lib/stripe'
import { decodeJwt } from '../../../../lib/quota'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guardscope.app'

export async function POST(req: NextRequest) {
  // Payments suspended during early access promo period
  if (process.env.PAYMENTS_ENABLED !== 'true') {
    return NextResponse.json(
      { error: 'payments_suspended', message: 'Payments are not yet active. Use your promo code to access Pro.' },
      { status: 503 }
    )
  }

  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const jwtPayload = token ? await decodeJwt(token) : null

  if (!jwtPayload?.sub || !jwtPayload?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: { plan?: string } = {}
  try { body = await req.json() } catch { /* empty body ok */ }

  const priceId = STRIPE_PRICES.pro_monthly
  if (!priceId) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: jwtPayload.email as string,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: jwtPayload.sub, plan: body.plan ?? 'pro' },
      success_url: `${SITE_URL}/?checkout=success`,
      cancel_url: `${SITE_URL}/?checkout=cancelled`,
      subscription_data: { metadata: { userId: jwtPayload.sub } },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout] error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}

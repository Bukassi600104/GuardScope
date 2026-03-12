import { NextRequest, NextResponse } from 'next/server'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY)!
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guardscope.app'

// ₦7,500/month in kobo
const PAYSTACK_PRO_AMOUNT_KOBO = 750_000

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  let body: { email?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: CORS })
  }

  const { email } = body
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email address required' }, { status: 400, headers: CORS })
  }

  if (!PAYSTACK_SECRET) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503, headers: CORS })
  }

  // Look up userId by email so the webhook can upgrade the right account
  let userId: string | null = null
  try {
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email.toLowerCase().trim())}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    )
    if (userRes.ok) {
      const rows = await userRes.json() as Array<{ id: string }>
      userId = rows[0]?.id ?? null
    }
  } catch {
    // Non-fatal — payment still proceeds, webhook will have email in metadata
  }

  const reference = `gs_upgrade_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  try {
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        amount: PAYSTACK_PRO_AMOUNT_KOBO,
        currency: 'NGN',
        reference,
        callback_url: `${SITE_URL}/?checkout=success`,
        metadata: {
          userId: userId ?? '',
          email: email.toLowerCase().trim(),
          plan: 'pro',
          cancel_action: `${SITE_URL}/upgrade`,
        },
        plan: process.env.PAYSTACK_PRO_PLAN_CODE,
      }),
    })

    const data = await res.json() as { status: boolean; data?: { authorization_url: string }; message?: string }

    if (!data.status || !data.data?.authorization_url) {
      console.error('[upgrade] Paystack error:', data.message)
      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500, headers: CORS })
    }

    return NextResponse.json({ url: data.data.authorization_url }, { headers: CORS })
  } catch (err) {
    console.error('[upgrade] error:', err)
    return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500, headers: CORS })
  }
}

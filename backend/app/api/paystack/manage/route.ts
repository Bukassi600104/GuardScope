import { NextRequest, NextResponse } from 'next/server'
import { getPaystackReadiness } from '../../../../lib/access'
import { authenticateRequest } from '../../../../lib/requestAuth'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''

export async function POST(req: NextRequest) {
  if (!getPaystackReadiness().ready) {
    return NextResponse.json({ error: 'billing_not_configured', message: 'Billing management is not available yet.' }, { status: 503 })
  }
  const auth = await authenticateRequest(req)
  if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${auth.userId}&select=paystack_subscription_code`, {
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
    cache: 'no-store',
  })
  const users = userRes.ok ? await userRes.json() as Array<{ paystack_subscription_code: string | null }> : []
  const subscriptionCode = users[0]?.paystack_subscription_code
  if (!subscriptionCode) return NextResponse.json({ error: 'No Paystack subscription found' }, { status: 404 })

  const paystackRes = await fetch(`https://api.paystack.co/subscription/${encodeURIComponent(subscriptionCode)}/manage/link`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    cache: 'no-store',
  })
  const data = await paystackRes.json() as { status?: boolean; data?: { link?: string }; message?: string }
  if (!paystackRes.ok || !data.status || !data.data?.link) {
    return NextResponse.json({ error: data.message ?? 'Unable to create billing management link' }, { status: 502 })
  }
  return NextResponse.json({ url: data.data.link })
}

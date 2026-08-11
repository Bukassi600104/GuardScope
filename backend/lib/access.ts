import { decodeJwt } from './quota'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''

export type AccessMode = 'legacy' | 'trial' | 'paid'
export type AccessPlan = 'trial' | 'pro' | 'team'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'non_renewing' | 'attention' | 'completed' | 'canceled' | 'unpaid' | 'paused'

export interface AccountStatus {
  userId: string
  email: string | null
  accessMode: AccessMode
  accessPlan: AccessPlan
  subscriptionStatus: SubscriptionStatus
  entitled: boolean
  trialScansUsed: number
  trialScanLimit: number
  trialScansRemaining: number
  paymentReady: boolean
  paymentProvider: 'paystack'
  currentPeriodEnd: string | null
  nextPaymentAt: string | null
  cancelAtPeriodEnd: boolean
}

interface UserAccessRow {
  email: string | null
  tier: string | null
  access_plan?: AccessPlan | null
  subscription_status?: SubscriptionStatus | null
  trial_scans_used?: number | null
  trial_scan_limit?: number | null
  current_period_end?: string | null
  next_payment_at?: string | null
  cancel_at_period_end?: boolean | null
}

export function getAccessMode(): AccessMode {
  const configured = process.env.GUARDSCOPE_ACCESS_MODE?.toLowerCase()
  if (configured === 'trial' || configured === 'paid') return configured
  return 'legacy'
}

export function getPaystackReadiness() {
  const missing = [
    ['PAYSTACK_SECRET_KEY', process.env.PAYSTACK_SECRET_KEY],
    ['PAYSTACK_PRO_MONTHLY_PLAN_CODE', process.env.PAYSTACK_PRO_MONTHLY_PLAN_CODE ?? process.env.PAYSTACK_PRO_PLAN_CODE],
    ['PAYSTACK_PRO_ANNUAL_PLAN_CODE', process.env.PAYSTACK_PRO_ANNUAL_PLAN_CODE],
  ].filter(([, value]) => !value).map(([name]) => name)

  return {
    ready: process.env.PAYMENTS_ENABLED === 'true' && missing.length === 0,
    missing,
  }
}

function normalizeRow(userId: string, row: UserAccessRow): AccountStatus {
  const accessMode = getAccessMode()
  const paymentReady = getPaystackReadiness().ready
  const legacyPlan = row.tier === 'team' ? 'team' : row.tier === 'pro' ? 'pro' : 'trial'
  const accessPlan = row.access_plan ?? legacyPlan
  const subscriptionStatus = row.subscription_status ?? (accessPlan === 'trial' ? 'trialing' : 'active')
  const trialScanLimit = row.trial_scan_limit ?? 5
  const trialScansUsed = row.trial_scans_used ?? 0
  const paidEntitled = (accessPlan === 'pro' || accessPlan === 'team') && ['active', 'non_renewing'].includes(subscriptionStatus)
  const trialEntitled = accessPlan === 'trial' && trialScansUsed < trialScanLimit

  return {
    userId,
    email: row.email,
    accessMode,
    accessPlan,
    subscriptionStatus,
    entitled: accessMode === 'legacy' || paidEntitled || trialEntitled,
    trialScansUsed,
    trialScanLimit,
    trialScansRemaining: Math.max(0, trialScanLimit - trialScansUsed),
    paymentReady,
    paymentProvider: 'paystack',
    currentPeriodEnd: row.current_period_end ?? null,
    nextPaymentAt: row.next_payment_at ?? null,
    cancelAtPeriodEnd: row.cancel_at_period_end ?? false,
  }
}

export async function getAccountStatus(userId: string): Promise<AccountStatus | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null
  const fields = 'email,tier,access_plan,subscription_status,trial_scans_used,trial_scan_limit,current_period_end,next_payment_at,cancel_at_period_end'
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=${fields}`, {
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const rows = await res.json() as UserAccessRow[]
  return rows[0] ? normalizeRow(userId, rows[0]) : null
}

export async function authenticateAccessToken(token: string | null) {
  if (!token) return null
  const payload = await decodeJwt(token)
  if (!payload?.sub) return null
  return { userId: payload.sub, email: payload.email ?? null, token }
}

export async function consumeTrialScan(userId: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return { allowed: false, scansUsed: 5, scanLimit: 5 }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/consume_trial_scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ target_user_id: userId }),
    cache: 'no-store',
  })
  if (!res.ok) return { allowed: false, scansUsed: 5, scanLimit: 5 }
  const rows = await res.json() as Array<{ allowed: boolean; scans_used: number; scan_limit: number }>
  const row = rows[0]
  return row
    ? { allowed: row.allowed, scansUsed: row.scans_used, scanLimit: row.scan_limit }
    : { allowed: false, scansUsed: 5, scanLimit: 5 }
}

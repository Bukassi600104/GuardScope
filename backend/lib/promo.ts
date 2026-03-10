// Promo code system — uses Supabase REST API directly (same pattern as quota.ts)

// Match quota.ts fallback pattern — Vercel uses SUPABASE_URL, local uses NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''

function headers() {
  return {
    'apikey':        SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=representation',
  }
}

export interface PromoCode {
  id: string
  code: string
  status: 'unused' | 'claimed' | 'expired'
  requester_name: string | null
  requester_email: string | null
  requester_country: string | null
  created_at: string
  claim_deadline: string
  claimed_by: string | null
  claimed_at: string | null
  pro_expires_at: string | null
}

// ─── Check if email already has a code ───────────────────────────────────────
export async function getCodeForEmail(email: string): Promise<PromoCode | null> {
  const url = `${SUPABASE_URL}/rest/v1/promo_codes?requester_email=eq.${encodeURIComponent(email.toLowerCase().trim())}&limit=1`
  const res = await fetch(url, { headers: headers() })
  if (!res.ok) return null
  const rows = await res.json() as PromoCode[]
  return rows[0] ?? null
}

// ─── Assign the next unused code to a lead ────────────────────────────────────
export async function assignCodeToLead(
  name: string,
  email: string,
  country: string
): Promise<PromoCode | null> {
  // Find next unassigned unused code
  const findUrl = `${SUPABASE_URL}/rest/v1/promo_codes?status=eq.unused&requester_email=is.null&claim_deadline=gt.${encodeURIComponent(new Date().toISOString())}&order=created_at.asc&limit=1`
  const findRes = await fetch(findUrl, { headers: headers() })
  if (!findRes.ok) return null
  const rows = await findRes.json() as PromoCode[]
  if (!rows[0]) return null
  const row = rows[0]

  // Assign to lead
  const updateUrl = `${SUPABASE_URL}/rest/v1/promo_codes?id=eq.${row.id}&status=eq.unused`
  const updateRes = await fetch(updateUrl, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({
      requester_name:    name.trim(),
      requester_email:   email.toLowerCase().trim(),
      requester_country: country,
    }),
  })
  if (!updateRes.ok) return null
  const updated = await updateRes.json() as PromoCode[]
  return updated[0] ?? null
}

// ─── Validate a code ─────────────────────────────────────────────────────────
export type ValidateResult =
  | { valid: true; code: PromoCode }
  | { valid: false; reason: 'not_found' | 'already_claimed' | 'expired' }

export async function validateCode(code: string): Promise<ValidateResult> {
  const url = `${SUPABASE_URL}/rest/v1/promo_codes?code=eq.${encodeURIComponent(code.toUpperCase().trim())}&limit=1`
  const res = await fetch(url, { headers: headers() })
  if (!res.ok) return { valid: false, reason: 'not_found' }
  const rows = await res.json() as PromoCode[]
  const data = rows[0]
  if (!data) return { valid: false, reason: 'not_found' }
  if (data.status === 'claimed') return { valid: false, reason: 'already_claimed' }

  if (data.status === 'expired' || new Date(data.claim_deadline) < new Date()) {
    // Mark expired if past deadline
    if (data.status !== 'expired') {
      await fetch(`${SUPABASE_URL}/rest/v1/promo_codes?id=eq.${data.id}`, {
        method: 'PATCH', headers: headers(), body: JSON.stringify({ status: 'expired' }),
      })
    }
    return { valid: false, reason: 'expired' }
  }

  return { valid: true, code: data }
}

// ─── Redeem code: claim + upgrade user tier ───────────────────────────────────
export type RedeemResult =
  | { success: true; proExpiresAt: string; requesterName: string | null }
  | { success: false; reason: string }

export async function redeemCode(code: string, userEmail: string): Promise<RedeemResult> {
  const validation = await validateCode(code)
  if (!validation.valid) {
    const messages: Record<string, string> = {
      not_found:       'Promo code not found. Check for typos and try again.',
      already_claimed: 'This promo code has already been used.',
      expired:         'This promo code has expired.',
    }
    return { success: false, reason: messages[validation.reason] ?? 'Invalid code.' }
  }

  // Look up user by email
  const userUrl = `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(userEmail.toLowerCase().trim())}&select=id,tier&limit=1`
  const userRes = await fetch(userUrl, { headers: headers() })
  if (!userRes.ok) return { success: false, reason: 'Could not verify your account. Please try again.' }
  const users = await userRes.json() as { id: string; tier: string }[]
  const user = users[0]
  if (!user) return { success: false, reason: 'Account not found. Please sign up first, then redeem your code.' }
  if (user.tier === 'pro' || user.tier === 'team') {
    return { success: false, reason: 'Your account is already on a Pro or Team plan.' }
  }

  const now = new Date()
  const proExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

  // Mark code claimed (atomic — only succeeds if still unused)
  const claimUrl = `${SUPABASE_URL}/rest/v1/promo_codes?code=eq.${encodeURIComponent(code.toUpperCase().trim())}&status=eq.unused`
  const claimRes = await fetch(claimUrl, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({
      status:         'claimed',
      claimed_by:     user.id,
      claimed_at:     now.toISOString(),
      pro_expires_at: proExpiresAt,
    }),
  })
  if (!claimRes.ok) return { success: false, reason: 'Code was just claimed by another account. Please try another code.' }
  const claimed = await claimRes.json() as PromoCode[]
  if (!claimed[0]) return { success: false, reason: 'Code was just claimed by another account. Please try another code.' }

  // Upgrade user to pro
  const upgradeUrl = `${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`
  const upgradeRes = await fetch(upgradeUrl, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ tier: 'pro', pro_expires_at: proExpiresAt }),
  })
  if (!upgradeRes.ok) {
    return { success: false, reason: 'Upgrade failed after code claim. Email support@guardscope.io with your code for manual fix.' }
  }

  return { success: true, proExpiresAt, requesterName: validation.code.requester_name }
}

// ─── Count remaining unused spots ────────────────────────────────────────────
export async function countRemainingCodes(): Promise<number> {
  const url = `${SUPABASE_URL}/rest/v1/promo_codes?status=eq.unused&requester_email=is.null&claim_deadline=gt.${encodeURIComponent(new Date().toISOString())}&select=id`
  const res = await fetch(url, {
    headers: { ...headers(), 'Prefer': 'count=exact' },
  })
  const count = res.headers.get('content-range')?.split('/')[1]
  return count ? parseInt(count, 10) : 0
}

/**
 * DELETE /api/user/delete — GDPR right to erasure.
 *
 * Deletes the authenticated user's account and all associated data:
 *   - analysis_history rows
 *   - usage rows
 *   - users row
 *   - Supabase auth user (auth.users)
 *
 * Email content is never stored, so there's nothing else to erase.
 * Requires a valid Bearer JWT.
 */
import { NextRequest, NextResponse } from 'next/server'
import { decodeJwt } from '../../../../lib/quota'
import { buildCorsHeaders } from '../../../../lib/cors'

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL) ?? ''
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY) ?? ''

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req, 'DELETE, OPTIONS') })
}

export async function DELETE(req: NextRequest) {
  const cors = buildCorsHeaders(req, 'DELETE, OPTIONS')

  if (!SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503, headers: cors })
  }

  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401, headers: cors })
  }

  const jwt = await decodeJwt(token)
  if (!jwt?.sub) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401, headers: cors })
  }

  const userId = jwt.sub

  try {
    // 1. Delete analysis history
    await fetch(`${SUPABASE_URL}/rest/v1/analysis_history?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    })

    // 2. Delete usage records
    await fetch(`${SUPABASE_URL}/rest/v1/usage?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    })

    // 3. Delete public users row
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    })

    // 4. Delete Supabase auth user (hard delete — removes from auth.users)
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    })

    if (!authRes.ok && authRes.status !== 404) {
      const body = await authRes.text()
      console.error('[user/delete] auth deletion failed:', authRes.status, body)
      return NextResponse.json({ error: 'Failed to delete account. Please contact support.' }, { status: 500, headers: cors })
    }

    return NextResponse.json({ success: true, message: 'Account and all data deleted.' }, { headers: cors })
  } catch (err) {
    console.error('[user/delete] error:', err)
    return NextResponse.json({ error: 'Deletion failed — please try again or contact support.' }, { status: 500, headers: cors })
  }
}

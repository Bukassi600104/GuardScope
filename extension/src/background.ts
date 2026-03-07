// GuardScope Service Worker — Phase 3 full implementation

import { getAuthState, setAuthState, clearAuthState } from './utils/auth'
import type { AuthState } from './utils/auth'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// ── Service Worker Keepalive ─────────────────────────────────────────────────
// MV3 service workers terminate after ~5 min of inactivity.
// The sidebar opens a port named 'guardscope-keepalive' before every ANALYZE call.
// Having an active port connection prevents SW termination during the 6-10s analysis.
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'guardscope-keepalive') {
    // Port stays open until sidebar disconnects (after response received).
    // No message handling needed — the open connection itself is the keepalive.
    port.onDisconnect.addListener(() => {
      // SW can now sleep again after analysis completes
    })
  }
})

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[GuardScope] Extension installed:', details.reason)
  if (details.reason === 'install') {
    // First-time install: open onboarding tab
    chrome.tabs.create({ url: chrome.runtime.getURL('src/onboarding/onboarding.html') })
  }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ type: 'PONG', version: '1.0.0' })
    return true
  }

  if (message.type === 'ANALYZE') {
    handleAnalyze()
      .then(sendResponse)
      .catch((e) => sendResponse({ success: false, error: String(e) }))
    return true // keep channel open for async response
  }

  if (message.type === 'GET_AUTH') {
    getAuthState().then(sendResponse)
    return true
  }

  if (message.type === 'SIGN_IN') {
    signIn(message.email, message.password).then(sendResponse)
    return true
  }

  if (message.type === 'SIGN_OUT') {
    clearAuthState().then(() => sendResponse({ success: true }))
    return true
  }

  return true
})

// ── Analyze ─────────────────────────────────────────────────────────────────

async function handleAnalyze(): Promise<{ success: boolean; report?: unknown; error?: string; status?: number }> {
  const stored = await chrome.storage.local.get('guardscope_current_email')
  const email = stored.guardscope_current_email

  if (!email?.fromEmail) {
    return { success: false, error: 'No email data — please open an email first' }
  }

  const token = await getValidToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify(email),
    })
  } catch (e) {
    return { success: false, error: `Network error: ${String(e)}` }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    return {
      success: false,
      error: (body.error as string) || `HTTP ${res.status}`,
      status: res.status,
    }
  }

  const report = await res.json()
  return { success: true, report }
}

// ── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Returns a valid access token, refreshing it if it expires within 5 minutes.
 * Returns null if user is not signed in or refresh fails (clears stale auth).
 */
async function getValidToken(): Promise<string | null> {
  const auth = await getAuthState()
  if (!auth.isAuthenticated || !auth.token) return null

  const FIVE_MIN = 5 * 60 * 1000
  const isExpiringSoon = auth.tokenExpiresAt && (auth.tokenExpiresAt - Date.now()) < FIVE_MIN

  if (!isExpiringSoon) return auth.token

  // Token near expiry — attempt silent refresh
  if (!auth.refreshToken) {
    await clearAuthState()
    return null
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ refresh_token: auth.refreshToken }),
    })
    if (!res.ok) {
      await clearAuthState()
      return null
    }
    const data = await res.json() as {
      access_token: string
      refresh_token: string
      expires_in: number
    }
    const newAuth = {
      ...auth,
      token: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: Date.now() + data.expires_in * 1000,
    }
    await setAuthState(newAuth)
    return data.access_token
  } catch {
    return auth.token // use existing token on network error
  }
}

async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  let res: Response
  try {
    res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    })
  } catch (e) {
    return { success: false, error: `Network error: ${String(e)}` }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    return { success: false, error: (body.error_description as string) || 'Invalid credentials' }
  }

  const data = await res.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
    user: { id: string; email: string }
  }

  const authState: AuthState = {
    isAuthenticated: true,
    userId: data.user.id,
    email: data.user.email,
    tier: 'free',
    token: data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  }
  await setAuthState(authState)
  return { success: true }
}

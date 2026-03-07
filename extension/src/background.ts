// GuardScope Service Worker — Phase 3 full implementation

import { getAuthState, setAuthState, clearAuthState } from './utils/auth'
import type { AuthState } from './utils/auth'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// ── Extension Badge ──────────────────────────────────────────────────────────
// Sets the toolbar icon badge when a HIGH/CRITICAL email is detected.
// Cleared when a new email is opened (fresh context).

function updateBadge(riskLevel: string) {
  try {
    if (riskLevel === 'CRITICAL') {
      chrome.action.setBadgeText({ text: '!' })
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' })
    } else if (riskLevel === 'HIGH') {
      chrome.action.setBadgeText({ text: '!' })
      chrome.action.setBadgeBackgroundColor({ color: '#f97316' })
    } else {
      chrome.action.setBadgeText({ text: '' })
    }
  } catch { /* ignore — badge is non-critical */ }
}

function clearBadge() {
  try { chrome.action.setBadgeText({ text: '' }) } catch { /* ignore */ }
}

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

  if (message.type === 'GET_HISTORY') {
    chrome.storage.local.get('guardscope_history', (res) => {
      sendResponse({ history: res.guardscope_history ?? [] })
    })
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

  clearBadge() // clear previous badge while new analysis runs

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

  const report = await res.json() as { risk_level?: string; risk_score?: number; verdict?: string; duration_ms?: number }
  // Update badge based on risk level
  if (report.risk_level) updateBadge(report.risk_level)
  // Save to local history (max 20 entries)
  await saveToHistory({
    fromEmail: email.fromEmail as string,
    subject: (email.subject as string) ?? '(no subject)',
    risk_level: report.risk_level ?? 'UNKNOWN',
    risk_score: report.risk_score ?? 0,
    verdict: report.verdict ?? '',
    analyzedAt: Date.now(),
    duration_ms: report.duration_ms ?? 0,
  })
  return { success: true, report }
}

// ── History ─────────────────────────────────────────────────────────────────

interface HistoryEntry {
  fromEmail: string
  subject: string
  risk_level: string
  risk_score: number
  verdict: string
  analyzedAt: number
  duration_ms: number
}

async function saveToHistory(entry: HistoryEntry): Promise<void> {
  try {
    const stored = await chrome.storage.local.get('guardscope_history')
    const history: HistoryEntry[] = stored.guardscope_history ?? []
    history.unshift(entry)
    if (history.length > 20) history.length = 20
    await chrome.storage.local.set({ guardscope_history: history })
  } catch { /* history is non-critical */ }
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

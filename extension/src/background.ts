// GuardScope Service Worker — Phase 3 full implementation

import { getAuthState, setAuthState, clearAuthState } from './utils/auth'
import type { AuthState } from './utils/auth'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

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

  const auth = await getAuthState()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth.token) {
    headers['Authorization'] = `Bearer ${auth.token}`
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
    user: { id: string; email: string }
  }

  const authState: AuthState = {
    isAuthenticated: true,
    userId: data.user.id,
    email: data.user.email,
    tier: 'free',
    token: data.access_token,
  }
  await setAuthState(authState)
  return { success: true }
}

import React, { useState, useEffect } from 'react'
import type { AuthState } from '../utils/auth'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" fill="#ef4343" />
      <path d="M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="white" />
    </svg>
  )
}

export default function Popup() {
  const [auth, setAuth] = useState<AuthState | null>(null)
  const [loading, setLoading] = useState(true)

  // Sign-in form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [signInError, setSignInError] = useState('')

  // Usage state
  const [usageCount, setUsageCount] = useState<number | null>(null)

  // Load auth on mount — read storage directly (avoids service worker timing issues)
  useEffect(() => {
    chrome.storage.local.get('guardscope_auth', (result) => {
      const stored = result.guardscope_auth as AuthState | undefined
      // Only treat as authenticated if token + email are actually present
      if (stored?.isAuthenticated && stored.token && stored.email) {
        setAuth(stored)
        fetchUsage(stored.userId!, stored.token)
      } else {
        setAuth({ isAuthenticated: false, userId: null, email: null, tier: 'free', token: null })
      }
      setLoading(false)
    })
  }, [])

  async function fetchUsage(userId: string, token: string) {
    try {
      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/usage?select=analysis_count&user_id=eq.${userId}&month=eq.${month}&year=eq.${year}`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
          },
        }
      )
      if (res.ok) {
        const rows = await res.json() as Array<{ analysis_count: number }>
        setUsageCount(rows[0]?.analysis_count ?? 0)
      }
    } catch {
      // usage display is non-critical
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setSigningIn(true)
    setSignInError('')

    chrome.runtime.sendMessage({ type: 'SIGN_IN', email, password }, (response: { success: boolean; error?: string }) => {
      setSigningIn(false)
      if (chrome.runtime.lastError || !response) {
        setSignInError('Extension error — try reloading')
        return
      }
      if (!response.success) {
        setSignInError(response.error ?? 'Sign in failed')
        return
      }
      // Read fresh auth directly from storage
      chrome.storage.local.get('guardscope_auth', (result) => {
        const newAuth = result.guardscope_auth as AuthState | undefined
        if (newAuth?.isAuthenticated && newAuth.token && newAuth.userId) {
          setAuth(newAuth)
          fetchUsage(newAuth.userId, newAuth.token)
        }
      })
    })
  }

  function handleSignOut() {
    chrome.storage.local.remove('guardscope_auth', () => {
      setAuth({ isAuthenticated: false, userId: null, email: null, tier: 'free', token: null })
      setUsageCount(null)
    })
  }

  function openGmail() {
    chrome.tabs.query({ url: 'https://mail.google.com/*' }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.update(tabs[0].id!, { active: true })
        chrome.windows.update(tabs[0].windowId!, { focused: true })
      } else {
        chrome.tabs.create({ url: 'https://mail.google.com' })
      }
      window.close()
    })
  }

  const TIER_BADGE: Record<string, string> = {
    free: 'border-[#2a2d3a] text-[#64748b]',
    pro: 'border-amber-500/40 text-amber-400',
    team: 'border-blue-500/40 text-blue-400',
  }
  const tierLabel = auth?.tier ? auth.tier.toUpperCase() : 'FREE'
  const badgeClass = TIER_BADGE[auth?.tier ?? 'free']

  const usageMax = auth?.tier === 'pro' || auth?.tier === 'team' ? null : 5
  const usageDisplay = usageCount !== null ? usageCount : '–'
  const usagePct = usageCount !== null && usageMax !== null ? Math.min(100, (usageCount / usageMax) * 100) : 0

  if (loading) {
    return (
      <div className="w-72 bg-[#0f1117] text-[#64748b] flex items-center justify-center py-10 text-xs font-['Inter',sans-serif]">
        Loading...
      </div>
    )
  }

  return (
    <div className="w-72 bg-[#0f1117] text-[#e2e8f0] font-['Inter',sans-serif]">

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2d3a]">
        <ShieldIcon />
        <span className="font-semibold text-sm">GuardScope</span>
        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded border ${badgeClass}`}>
          {tierLabel}
        </span>
      </div>

      {auth?.isAuthenticated ? (
        /* ── SIGNED IN ── */
        <>
          {/* User info */}
          <div className="px-4 py-3 border-b border-[#2a2d3a]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22c55e]"></div>
              <span className="text-xs text-[#e2e8f0] truncate">{auth.email}</span>
            </div>
          </div>

          {/* Usage */}
          <div className="px-4 py-3 border-b border-[#2a2d3a]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-[#64748b]">Monthly analyses</span>
              <span className="text-xs text-[#e2e8f0]">
                {usageMax !== null ? `${usageDisplay} / ${usageMax}` : `${usageDisplay} (unlimited)`}
              </span>
            </div>
            {usageMax !== null && (
              <div className="w-full bg-[#1a1d27] rounded-full h-1.5">
                <div
                  className="bg-[#22c55e] h-1.5 rounded-full transition-all"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 py-3 space-y-2">
            <button
              onClick={openGmail}
              className="w-full py-2 px-4 bg-[#ef4343] text-white text-sm font-semibold rounded-lg hover:bg-[#dc2626] transition-colors"
            >
              Open Gmail
            </button>
            <button
              onClick={handleSignOut}
              className="w-full py-2 px-4 bg-transparent text-[#64748b] text-xs rounded-lg border border-[#2a2d3a] hover:text-[#e2e8f0] hover:border-[#64748b] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </>
      ) : (
        /* ── SIGN IN FORM ── */
        <>
          <form onSubmit={handleSignIn} className="px-4 py-3 space-y-2.5">
            <p className="text-xs text-[#64748b] pb-1">Sign in to track your analyses</p>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              autoFocus
              className="w-full px-3 py-2 text-xs bg-[#1a1d27] border border-[#2a2d3a] rounded-lg text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:border-[#ef4343] transition-colors"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-3 py-2 text-xs bg-[#1a1d27] border border-[#2a2d3a] rounded-lg text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:border-[#ef4343] transition-colors"
            />

            {signInError && (
              <p className="text-[10px] text-[#ef4343]">{signInError}</p>
            )}

            <button
              type="submit"
              disabled={signingIn}
              className="w-full py-2 px-4 bg-[#ef4343] text-white text-sm font-semibold rounded-lg hover:bg-[#dc2626] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {signingIn ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-[10px] text-[#64748b] text-center">
              No account?{' '}
              <a
                href="https://guardscope.io/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ef4343] hover:underline"
              >
                Sign up at guardscope.io
              </a>
            </p>
          </form>

          {/* Quick access without sign-in */}
          <div className="px-4 pb-3">
            <button
              onClick={openGmail}
              className="w-full py-2 px-4 bg-transparent text-[#64748b] text-xs rounded-lg border border-[#2a2d3a] hover:text-[#e2e8f0] hover:border-[#64748b] transition-colors"
            >
              Open Gmail (without signing in)
            </button>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#2a2d3a]">
        <p className="text-[10px] text-[#64748b] text-center">Powered by GuardScope AI</p>
      </div>
    </div>
  )
}

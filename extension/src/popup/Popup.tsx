import React, { useState, useEffect } from 'react'
import type { AuthState } from '../utils/auth'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string

// Decode JWT expiry without a library — Supabase JWTs are standard RS256 tokens.
// Returns true if the token is expired or unparseable.
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
  } catch {
    return true // unparseable = treat as expired
  }
}

function GuardScopeIcon() {
  const cx = 21, cy = 24, r = 13
  const toR = (d: number) => (d * Math.PI) / 180
  const ax1 = cx + r * Math.cos(toR(30)),  ay1 = cy + r * Math.sin(toR(30))
  const ax2 = cx + r * Math.cos(toR(-30)), ay2 = cy + r * Math.sin(toR(-30))
  const od = r + 4  // outer dot at 0° (center of gap), clearly inside gap opening
  const ox = cx + od * Math.cos(toR(0)), oy = cy + od * Math.sin(toR(0))
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="gs-popup-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#72D8FF"/>
          <stop offset="100%" stopColor="#1A8FFF"/>
        </linearGradient>
      </defs>
      <path d={`M ${ax1.toFixed(2)} ${ay1.toFixed(2)} A ${r} ${r} 0 1 1 ${ax2.toFixed(2)} ${ay2.toFixed(2)}`}
        stroke="url(#gs-popup-g)" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
      <circle cx={cx} cy={cy} r="3.5" fill="url(#gs-popup-g)"/>
      <circle cx={ox.toFixed(2)} cy={oy.toFixed(2)} r="3.0" fill="url(#gs-popup-g)"/>
    </svg>
  )
}

export default function Popup() {
  const [auth, setAuth] = useState<AuthState | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGmailTab, setIsGmailTab] = useState(false)

  // Sign-in form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [signInError, setSignInError] = useState('')

  // Usage state
  const [usageCount, setUsageCount] = useState<number | null>(null)

  // Promo code state
  const [showPromo, setShowPromo] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [promoSuccess, setPromoSuccess] = useState(false)

  // Check if the current tab is Gmail
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setIsGmailTab((tabs[0]?.url ?? '').includes('mail.google.com'))
    })
  }, [])

  // Load auth on mount — read storage directly (avoids service worker timing issues).
  // Also validate JWT expiry so stale sessions from previous installs don't persist.
  useEffect(() => {
    chrome.storage.local.get('guardscope_auth', (result) => {
      const stored = result.guardscope_auth as AuthState | undefined
      const isValid =
        stored?.isAuthenticated &&
        !!stored.token &&
        !!stored.email &&
        !isTokenExpired(stored.token)

      if (isValid && stored) {
        setAuth(stored)
        fetchUsage(stored.userId!, stored.token!)
      } else {
        // Clear stale/expired auth and show sign-in form
        if (stored) chrome.storage.local.remove('guardscope_auth')
        setAuth({ isAuthenticated: false, userId: null, email: null, tier: 'free', token: null })
      }
      setLoading(false)
    })
  }, [])

  async function fetchUsage(_userId: string, token: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/usage`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json() as { count: number; limit: number | null; tier: string }
        setUsageCount(data.count)
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

  async function handleRedeemPromo(e: React.FormEvent) {
    e.preventDefault()
    setPromoLoading(true)
    setPromoError('')
    try {
      const res = await fetch(`${BACKEND_URL}/api/promo/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(auth?.token ? { 'Authorization': `Bearer ${auth.token}` } : {}),
        },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase(), email: auth?.email ?? '' }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setPromoError(data.error ?? 'Invalid or expired promo code')
        return
      }
      setPromoSuccess(true)
      setAuth(prev => prev ? { ...prev, tier: 'pro' } : prev)
      setPromoCode('')
      setTimeout(() => { setShowPromo(false); setPromoSuccess(false) }, 2500)
    } catch {
      setPromoError('Network error — please try again')
    } finally {
      setPromoLoading(false)
    }
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
    free: 'border-[rgba(57,182,255,0.2)] text-[#64748b]',
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
      <div className="w-72 bg-[#071c2c] text-[#64748b] flex items-center justify-center py-10 text-xs font-['Inter',sans-serif]">
        Loading...
      </div>
    )
  }

  return (
    <div className="w-72 bg-[#071c2c] text-[#e2e8f0] font-['Inter',sans-serif]">

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(57,182,255,0.15)]">
        <GuardScopeIcon />
        <span className="font-semibold text-sm tracking-wide" style={{ fontFamily: 'Sora, Inter, sans-serif' }}>
          <span style={{ color: '#E7EEF4' }}>Guard</span><span style={{ color: '#39B6FF' }}>Scope</span>
        </span>
        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded border ${badgeClass}`}>
          {tierLabel}
        </span>
      </div>

      {/* Not-on-Gmail notice */}
      {!isGmailTab && (
        <div className="px-4 py-3 border-b border-[rgba(57,182,255,0.15)] bg-[#0a2338]">
          <div className="flex items-start gap-2.5">
            <span className="text-base mt-0.5">📧</span>
            <div>
              <p className="text-xs font-semibold text-[#e2e8f0] leading-snug">
                GuardScope runs inside Gmail
              </p>
              <p className="text-[10px] text-[#64748b] mt-1 leading-relaxed">
                Open Gmail in any tab to start scanning emails. Sign in below to track your usage across devices.
              </p>
            </div>
          </div>
          <button
            onClick={openGmail}
            className="mt-2.5 w-full py-2 px-4 text-white text-xs font-semibold rounded-lg transition-colors" style={{ background: 'linear-gradient(135deg,#39B6FF,#1F8DFF)' }}
          >
            Open Gmail →
          </button>
        </div>
      )}

      {auth?.isAuthenticated ? (
        /* ── SIGNED IN ── */
        <>
          {/* User info */}
          <div className="px-4 py-3 border-b border-[rgba(57,182,255,0.15)]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22c55e]"></div>
              <span className="text-xs text-[#e2e8f0] truncate">{auth.email}</span>
            </div>
          </div>

          {/* Usage */}
          <div className="px-4 py-3 border-b border-[rgba(57,182,255,0.15)]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-[#64748b]">Monthly analyses</span>
              <span className="text-xs text-[#e2e8f0]">
                {usageMax !== null ? `${usageDisplay} / ${usageMax}` : `${usageDisplay} (unlimited)`}
              </span>
            </div>
            {usageMax !== null && (
              <div className="w-full bg-[#0a2338] rounded-full h-1.5">
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
              className="w-full py-2 px-4 text-white text-sm font-semibold rounded-lg transition-colors" style={{ background: 'linear-gradient(135deg,#39B6FF,#1F8DFF)' }}
            >
              Open Gmail
            </button>
            {(auth?.tier === 'free') && !showPromo && (
              <button
                onClick={() => { setShowPromo(true); setPromoError('') }}
                className="block w-full py-2 px-4 text-center text-xs font-semibold border rounded-lg transition-colors"
                style={{ color: '#39B6FF', borderColor: 'rgba(57,182,255,0.3)', background: 'rgba(57,182,255,0.06)', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
              >
                🎁 Have a promo code? Activate Pro
              </button>
            )}
            {(auth?.tier === 'free') && showPromo && (
              promoSuccess ? (
                <div className="text-center py-2">
                  <p className="text-xs font-semibold text-green-400">🎉 Pro activated! 30 days unlimited.</p>
                </div>
              ) : (
                <form onSubmit={handleRedeemPromo} className="space-y-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="GS-XXXX-XXXX"
                    required
                    autoFocus
                    className="w-full px-3 py-2 text-xs bg-[#0a2338] border border-[rgba(57,182,255,0.15)] rounded-lg text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:border-[#39B6FF] font-mono tracking-widest uppercase"
                  />
                  {promoError && <p className="text-[10px] text-[#ef4343]">{promoError}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setShowPromo(false); setPromoError('') }}
                      className="flex-1 py-1.5 text-xs border border-[rgba(57,182,255,0.15)] rounded-lg text-[#64748b] hover:text-[#e2e8f0] transition-colors"
                      style={{ background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={promoLoading || promoCode.length < 4}
                      className="flex-1 py-1.5 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#39B6FF,#1F8DFF)', border: 'none', cursor: promoLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      {promoLoading ? 'Activating...' : 'Activate'}
                    </button>
                  </div>
                </form>
              )
            )}
            <button
              onClick={handleSignOut}
              className="w-full py-2 px-4 bg-transparent text-[#64748b] text-xs rounded-lg border border-[rgba(57,182,255,0.15)] hover:text-[#e2e8f0] hover:border-[#64748b] transition-colors"
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
              className="w-full px-3 py-2 text-xs bg-[#0a2338] border border-[rgba(57,182,255,0.15)] rounded-lg text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:border-[#39B6FF] transition-colors"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-3 py-2 text-xs bg-[#0a2338] border border-[rgba(57,182,255,0.15)] rounded-lg text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:border-[#39B6FF] transition-colors"
            />

            {signInError && (
              <p className="text-[10px] text-[#ef4343]">{signInError}</p>
            )}

            <button
              type="submit"
              disabled={signingIn}
              className="w-full py-2 px-4 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors" style={{ background: 'linear-gradient(135deg,#39B6FF,#1F8DFF)' }}
            >
              {signingIn ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-[10px] text-[#64748b] text-center">
              No account?{' '}
              <a
                href={`${BACKEND_URL}/signup`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#39B6FF] hover:underline"
              >
                Create one free →
              </a>
            </p>
          </form>

          {/* Quick access without sign-in */}
          <div className="px-4 pb-3">
            <button
              onClick={openGmail}
              className="w-full py-2 px-4 bg-transparent text-[#64748b] text-xs rounded-lg border border-[rgba(57,182,255,0.15)] hover:text-[#e2e8f0] hover:border-[#64748b] transition-colors"
            >
              Open Gmail (without signing in)
            </button>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[rgba(57,182,255,0.15)]">
        <p className="text-[10px] text-[#64748b] text-center">Powered by Mercury-2 AI</p>
      </div>
    </div>
  )
}

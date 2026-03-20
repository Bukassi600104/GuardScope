import React, { useState, useEffect } from 'react'
import RiskScore from './components/RiskScore'
import FlagCard from './components/FlagCard'
import ProgressBar from './components/ProgressBar'
import TechnicalDetails from './components/TechnicalDetails'
import type { AnalysisReport, AppState } from '../utils/analyze'
import type { ExtractedEmail } from '../utils/emailExtractor'
import { t } from '../utils/i18n'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string

// GuardScope arc logo — uses brand gradient by default, solid color when risk theme is active
function GuardScopeIcon({ color }: { color?: string }) {
  const cx = 21, cy = 24, r = 13
  const toR = (d: number) => (d * Math.PI) / 180
  const ax1 = cx + r * Math.cos(toR(30)),  ay1 = cy + r * Math.sin(toR(30))
  const ax2 = cx + r * Math.cos(toR(-30)), ay2 = cy + r * Math.sin(toR(-30))
  const od = r + 4  // outer dot at 0° (center of gap), clearly inside gap opening
  const ox = cx + od * Math.cos(toR(0)), oy = cy + od * Math.sin(toR(0))
  const useGradient = !color || color === '#39B6FF'
  const fill = useGradient ? 'url(#gs-app-g)' : color
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
      {useGradient && (
        <defs>
          <linearGradient id="gs-app-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#72D8FF"/>
            <stop offset="100%" stopColor="#1A8FFF"/>
          </linearGradient>
        </defs>
      )}
      <path d={`M ${ax1.toFixed(2)} ${ay1.toFixed(2)} A ${r} ${r} 0 1 1 ${ax2.toFixed(2)} ${ay2.toFixed(2)}`}
        stroke={fill} strokeWidth="3.2" strokeLinecap="round" fill="none"/>
      <circle cx={cx} cy={cy} r="3.5" fill={fill}/>
      <circle cx={ox.toFixed(2)} cy={oy.toFixed(2)} r="3.0" fill={fill}/>
    </svg>
  )
}

const RISK_BADGE_COLORS: Record<string, string> = {
  SAFE:     'border-green-500/40 text-green-400',
  LOW:      'border-amber-400/40 text-amber-400',
  MEDIUM:   'border-orange-500/40 text-orange-400',
  HIGH:     'border-red-500/40 text-red-400',
  CRITICAL: 'border-red-400/60 text-red-300',
}

// Full UI theme per risk level — applied when a result is showing
const RISK_THEME: Record<string, {
  topBar: string      // thick top accent bar color
  headerBg: string    // header background
  headerBorder: string
  bodyBg: string      // scrollable content area tint
  footerBg: string
  btnBg: string       // primary action button background
  btnBgHover: string  // button hover background
  btnGlow: string     // button box-shadow glow
}> = {
  SAFE: {
    topBar: '#22c55e',
    headerBg: 'rgba(20,40,25,0.98)',
    headerBorder: 'rgba(34,197,94,0.35)',
    bodyBg: 'rgba(34,197,94,0.03)',
    footerBg: 'rgba(20,40,25,0.98)',
    btnBg: '#16a34a',
    btnBgHover: '#15803d',
    btnGlow: 'rgba(34,197,94,0.35)',
  },
  LOW: {
    topBar: '#FFB020',
    headerBg: 'rgba(40,28,4,0.98)',
    headerBorder: 'rgba(255,176,32,0.35)',
    bodyBg: 'rgba(255,176,32,0.03)',
    footerBg: 'rgba(40,28,4,0.98)',
    btnBg: '#D97706',
    btnBgHover: '#B45309',
    btnGlow: 'rgba(255,176,32,0.4)',
  },
  MEDIUM: {
    topBar: '#f97316',
    headerBg: 'rgba(40,22,8,0.98)',
    headerBorder: 'rgba(249,115,22,0.4)',
    bodyBg: 'rgba(249,115,22,0.04)',
    footerBg: 'rgba(40,22,8,0.98)',
    btnBg: '#ea6a0a',
    btnBgHover: '#c2570a',
    btnGlow: 'rgba(249,115,22,0.4)',
  },
  HIGH: {
    topBar: '#ef4444',
    headerBg: 'rgba(40,10,10,0.98)',
    headerBorder: 'rgba(239,68,68,0.45)',
    bodyBg: 'rgba(239,68,68,0.04)',
    footerBg: 'rgba(40,10,10,0.98)',
    btnBg: '#ef4343',
    btnBgHover: '#dc2626',
    btnGlow: 'rgba(239,68,68,0.4)',
  },
  CRITICAL: {
    topBar: '#dc2626',
    headerBg: 'rgba(50,5,5,0.99)',
    headerBorder: 'rgba(220,38,38,0.6)',
    bodyBg: 'rgba(239,68,68,0.06)',
    footerBg: 'rgba(50,5,5,0.99)',
    btnBg: '#b91c1c',
    btnBgHover: '#991b1b',
    btnGlow: 'rgba(220,38,38,0.5)',
  },
}

const DEFAULT_THEME = RISK_THEME.HIGH // fallback before result

const SHIELD_COLORS: Record<string, string> = {
  SAFE: '#22c55e', LOW: '#FFB020', MEDIUM: '#f97316', HIGH: '#ef4343', CRITICAL: '#ef4343',
}

const VERDICT_BORDER_COLORS: Record<string, string> = {
  SAFE:     'border-green-500/30 bg-green-500/8',
  LOW:      'border-amber-400/30 bg-amber-400/8',
  MEDIUM:   'border-orange-500/30 bg-orange-500/8',
  HIGH:     'border-red-500/30 bg-red-500/8',
  CRITICAL: 'border-red-400/40 bg-red-400/10',
}

const VERDICT_TEXT_COLORS: Record<string, string> = {
  SAFE: 'text-green-400', LOW: 'text-amber-400', MEDIUM: 'text-orange-400',
  HIGH: 'text-red-400', CRITICAL: 'text-red-300',
}

const VERDICT_ICONS: Record<string, string> = {
  SAFE: '✅', LOW: '⚠️', MEDIUM: '⚠️', HIGH: '🚨', CRITICAL: '🚨',
}

interface HistoryEntry {
  fromEmail: string
  subject: string
  risk_level: string
  risk_score: number
  analyzedAt: number
}

const RISK_BADGE_DOT: Record<string, string> = {
  SAFE: 'bg-green-500', LOW: 'bg-amber-400', MEDIUM: 'bg-orange-500', HIGH: 'bg-red-500', CRITICAL: 'bg-red-400',
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [pendingScore, setPendingScore] = useState<number | undefined>(undefined)
  const [error, setError] = useState<string>('')
  const [currentEmail, setCurrentEmail] = useState<ExtractedEmail | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userTier, setUserTier] = useState<string>('free')
  const [anonCount, setAnonCount] = useState(0)
  // Each side panel instance tracks its own tabId so email reads are tab-specific
  const [myTabId, setMyTabId] = useState<number | null>(null)

  // Inline sign-in form state
  const [showSignIn, setShowSignIn] = useState(false)
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInLoading, setSignInLoading] = useState(false)
  const [signInError, setSignInError] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Inline promo code state
  const [showPromo, setShowPromo] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [promoSuccess, setPromoSuccess] = useState(false)
  // Whether free promo codes are still available (null = not yet fetched)
  const [promoAvailable, setPromoAvailable] = useState<boolean | null>(null)
  // Whether this user has previously redeemed a promo (i.e. had pro, now expired)
  const [hadPro, setHadPro] = useState(false)

  // On mount: resolve own tabId, then read tab-specific email + shared state
  useEffect(() => {
    // Side panels are associated with a tab — query the active tab in this window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id ?? null
      setMyTabId(tabId)

      // Mark onboarding complete — the user has opened the panel (regardless of auth state)
      // This unblocks the content script which polls for this flag before starting email detection
      chrome.storage.local.set({ guardscope_onboarding_complete: true })

      const emailKey = tabId ? `guardscope_email_${tabId}` : 'guardscope_current_email'
      chrome.storage.local.get(
        [emailKey, 'guardscope_history', 'guardscope_auth', 'guardscope_anon_count', 'guardscope_had_pro'],
        (result) => {
          const email = result[emailKey] as ExtractedEmail | undefined
          if (email?.fromEmail) {
            setCurrentEmail(email)
            setAppState('idle')
          } else {
            setAppState('no_email')
            // Request an immediate email sync from the content script.
            // Handles the case where an email is already open when the panel is first launched
            // and the content script hadn't started detection yet (onboarding was incomplete).
            if (tabId) {
              chrome.tabs.sendMessage(tabId, { type: 'REQUEST_EMAIL_SYNC' }).catch(() => {
                // Content script may not be ready yet — the storage onChanged listener
                // in content.ts will handle this when guardscope_onboarding_complete fires
              })
            }
          }
          setHistory((result.guardscope_history as HistoryEntry[]) ?? [])

          const auth = result.guardscope_auth as { isAuthenticated?: boolean; tier?: string; email?: string } | undefined
          if (auth?.isAuthenticated) {
            setIsAuthenticated(true)
            setUserTier(auth.tier ?? 'free')
            setUserEmail(auth.email ?? null)
          }
          if (result.guardscope_had_pro) setHadPro(true)
          const count = (result.guardscope_anon_count as number) ?? 0
          setAnonCount(count)
          // If already at limit, reflect that immediately
          if (!auth?.isAuthenticated && count >= 5) setAppState('limit_reached')
        }
      )
    })
  }, [])

  // Track side panel visibility so the content script can show/hide the mini-tab.
  // - On mount (panel just opened): mark visible = true
  // - On pagehide (panel closed by Chrome's × button): mark visible = false
  useEffect(() => {
    chrome.storage.local.set({ guardscope_panel_visible: true })
    const onHide = () => chrome.storage.local.set({ guardscope_panel_visible: false })
    const onShow = () => {
      if (!document.hidden) chrome.storage.local.set({ guardscope_panel_visible: true })
    }
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onShow)
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onShow)
    }
  }, [])

  // Auto-reset connection error when internet comes back online
  useEffect(() => {
    const onOnline = () => {
      setAppState(prev => {
        if (prev === 'error') {
          setError('')
          return currentEmail?.fromEmail ? 'idle' : 'no_email'
        }
        return prev
      })
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [currentEmail])

  // Fetch promo availability once when limit_reached is first shown
  useEffect(() => {
    if (appState !== 'limit_reached' || promoAvailable !== null) return
    fetch(`${BACKEND_URL}/api/promo/status`)
      .then(r => r.json())
      .then((d: { available?: boolean }) => setPromoAvailable(d.available ?? false))
      .catch(() => setPromoAvailable(true)) // default to available on network error
  }, [appState, promoAvailable])

  // React to email/quota state changes from content.ts and other tabs.
  useEffect(() => {
    const onStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area !== 'local') return

      // Tab-specific email key — only react to our own tab's email changes
      const emailKey = myTabId ? `guardscope_email_${myTabId}` : 'guardscope_current_email'
      if (emailKey in changes) {
        const newEmail = changes[emailKey].newValue as ExtractedEmail | undefined
        if (newEmail?.fromEmail) {
          setCurrentEmail(newEmail)
          setAppState(prev => prev === 'analyzing' ? prev : 'idle')
        } else {
          setCurrentEmail(null)
          setAppState(prev => prev === 'idle' || prev === 'no_email' ? 'no_email' : prev)
        }
      }

      // Shared anon quota — when another tab increments it past the limit,
      // immediately reflect limit_reached on this tab too
      if ('guardscope_anon_count' in changes) {
        const newCount = changes.guardscope_anon_count.newValue as number
        setAnonCount(newCount)
        setIsAuthenticated(prev => {
          if (!prev && newCount >= 5) {
            setAppState(curr => curr === 'idle' ? 'limit_reached' : curr)
          }
          return prev
        })
      }
    }
    chrome.storage.onChanged.addListener(onStorageChange)
    return () => chrome.storage.onChanged.removeListener(onStorageChange)
  }, [myTabId])

  const handleAnalyze = () => {
    setAppState('analyzing')
    setError('')

    // Open a long-lived port BEFORE sending ANALYZE.
    // MV3 service workers terminate after ~5 min of inactivity.
    // An open port connection prevents termination for the duration of the analysis.
    let port: chrome.runtime.Port | null = null
    try {
      port = chrome.runtime.connect({ name: 'guardscope-keepalive' })
    } catch {
      // Couldn't open port — proceed anyway (SW likely already active)
    }

    const cleanup = () => {
      try { port?.disconnect() } catch { /* ignore */ }
      port = null
    }

    // Safety timeout — force error state if backend takes > 90s (Vercel max is 60s)
    const analysisTimeout = setTimeout(() => {
      cleanup()
      setError('Analysis timed out. Please try again.')
      setAppState('error')
    }, 90_000)

    chrome.runtime.sendMessage({ type: 'ANALYZE', tabId: myTabId }, (response: {
      success: boolean
      report?: AnalysisReport
      error?: string
      status?: number
    }) => {
      clearTimeout(analysisTimeout)
      cleanup()

      if (chrome.runtime.lastError) {
        const msg = chrome.runtime.lastError.message ?? ''
        if (msg.includes('No email') || msg.includes('open an email')) {
          setError('Open an email in Gmail first, then click Analyze.')
        } else if (msg.includes('Could not establish connection') || msg.includes('Receiving end does not exist')) {
          setError('Extension lost connection. Please reload this page and try again.')
        } else if (msg.includes('Extension context invalidated')) {
          setError('Extension was updated. Please reload the Gmail page to continue.')
        } else {
          setError(msg || 'Something went wrong. Please try again.')
        }
        setAppState('error')
        return
      }

      if (!response?.success) {
        if (response?.status === 429 || response?.error === 'limit_reached') {
          setAppState('limit_reached')
        } else if (response?.error?.includes('Network error')) {
          setError('Cannot reach GuardScope servers. Check your internet connection and try again.')
          setAppState('error')
        } else if (response?.status && response.status >= 500) {
          setError('GuardScope servers are temporarily unavailable. Please try again in a moment.')
          setAppState('error')
        } else {
          setError(response?.error ?? 'Analysis failed. Please try again.')
          setAppState('error')
        }
        return
      }

      if (response.report) {
        const reportData = response.report
        // Increment anon counter immediately on successful response — before any delay
        // so navigation/panel-close can't lose the increment.
        chrome.storage.local.get(['guardscope_history', 'guardscope_anon_count', 'guardscope_auth'], (r) => {
          setHistory((r.guardscope_history as HistoryEntry[]) ?? [])
          const auth = r.guardscope_auth as { isAuthenticated?: boolean } | undefined
          if (!auth?.isAuthenticated) {
            const newCount = ((r.guardscope_anon_count as number) ?? 0) + 1
            chrome.storage.local.set({ guardscope_anon_count: newCount })
            setAnonCount(newCount)
          }
        })
        // Show gauge settling on real score for 1.8s before switching to result view
        setPendingScore(reportData.risk_score)
        setTimeout(() => {
          setReport(reportData)
          setAppState('result')
          setPendingScore(undefined)
        }, 1800)
      }
    })
  }

  const handleRetry = () => {
    setReport(null)
    setError('')
    setPendingScore(undefined)
    setAppState(currentEmail?.fromEmail ? 'idle' : 'no_email')
  }

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setSignInLoading(true)
    setSignInError('')
    chrome.runtime.sendMessage({ type: 'SIGN_IN', email: signInEmail, password: signInPassword }, (response: { success: boolean; error?: string }) => {
      setSignInLoading(false)
      if (chrome.runtime.lastError || !response) {
        setSignInError('Extension error — try reloading')
        return
      }
      if (!response.success) {
        setSignInError(response.error ?? 'Sign in failed. Check your email and password.')
        return
      }
      chrome.storage.local.get('guardscope_auth', (result) => {
        const auth = result.guardscope_auth as { isAuthenticated?: boolean; tier?: string; email?: string } | undefined
        if (auth?.isAuthenticated) {
          setIsAuthenticated(true)
          setUserTier(auth.tier ?? 'free')
        }
        setShowSignIn(false)
        setSignInEmail('')
        setSignInPassword('')
        // If we were at limit_reached, clear it now that user is authenticated
        setAppState(prev => prev === 'limit_reached' ? (currentEmail?.fromEmail ? 'idle' : 'no_email') : prev)
      })
    })
  }

  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault()
    setPromoLoading(true)
    setPromoError('')
    try {
      const stored = await new Promise<Record<string, unknown>>(resolve =>
        chrome.storage.local.get('guardscope_auth', resolve)
      )
      const auth = stored.guardscope_auth as { token?: string; email?: string } | undefined
      const res = await fetch(`${BACKEND_URL}/api/promo/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(auth?.token ? { 'Authorization': `Bearer ${auth.token}` } : {}),
        },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase(), email: auth?.email ?? userEmail ?? '' }),
      })
      const data = await res.json() as { error?: string; tier?: string }
      if (!res.ok) {
        setPromoError(data.error ?? 'Invalid or expired promo code')
        return
      }
      setPromoSuccess(true)
      setUserTier('pro')
      setHadPro(true)
      chrome.storage.local.set({ guardscope_had_pro: true })
      setPromoCode('')
      setTimeout(() => { setShowPromo(false); setPromoSuccess(false) }, 2500)
    } catch {
      setPromoError('Network error — please try again')
    } finally {
      setPromoLoading(false)
    }
  }

  const [copied, setCopied] = useState(false)
  const handleShare = () => {
    if (!report) return
    const flagLines = [
      ...report.red_flags.map(f => `⚠ ${f.label}: ${(f as { evidence?: string }).evidence ?? ''}`),
      ...report.green_flags.map(f => `✓ ${f.label}: ${(f as { detail?: string }).detail ?? ''}`),
    ]
    const text = [
      `GuardScope Email Security Report`,
      `Risk: ${report.risk_level} (${report.risk_score}/100)`,
      ``,
      report.verdict,
      ``,
      `→ ${report.recommendation}`,
      ``,
      ...flagLines,
      ``,
      `Analyzed by GuardScope — ${BACKEND_URL}`,
    ].join('\n')

    // navigator.clipboard is blocked in sandboxed iframes — use execCommand fallback
    const doCopy = (): boolean => {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      try {
        return document.execCommand('copy')
      } finally {
        document.body.removeChild(ta)
      }
    }

    // Try modern API first; fall back to execCommand
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
        .catch(() => {
          const ok = doCopy()
          if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000) }
        })
    } else {
      const ok = doCopy()
      if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000) }
    }
  }

  const riskLevel = report?.risk_level ?? 'MEDIUM'
  const shieldColor = appState === 'result' ? (SHIELD_COLORS[riskLevel] ?? '#ef4343') : '#39B6FF'
  const theme = appState === 'result' ? (RISK_THEME[riskLevel] ?? DEFAULT_THEME) : null

  return (
    <div className="h-screen text-[#e2e8f0] font-['Inter',sans-serif] flex flex-col overflow-hidden"
      style={{ background: theme ? theme.bodyBg : 'transparent', backgroundColor: theme ? undefined : '#071C2C' }}>

      {/* ── Risk-level accent bar (top) ── */}
      {theme && (
        <div style={{ height: 3, background: theme.topBar, flexShrink: 0, transition: 'background 0.4s ease' }} />
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
        style={{
          background: theme ? theme.headerBg : '#071C2C',
          borderBottom: `1px solid ${theme ? theme.headerBorder : 'rgba(57,182,255,0.15)'}`,
          transition: 'background 0.4s ease, border-color 0.4s ease',
        }}>
        <GuardScopeIcon color={shieldColor} />
        <span className="font-semibold text-sm tracking-wide" style={{ fontFamily: 'Sora, Inter, sans-serif' }}>
          <span style={{ color: shieldColor === '#39B6FF' ? '#E7EEF4' : '#fff' }}>Guard</span>
          <span style={{ color: shieldColor }}>Scope</span>
        </span>

        {/* Right-side controls: badge + sign-in + history */}
        <div className="ml-auto flex items-center gap-1.5">
          {appState === 'result' && report && (
            <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wider ${RISK_BADGE_COLORS[report.risk_level]}`}>
              {report.risk_level}
            </span>
          )}
          {appState === 'analyzing' && (
            <span className="text-[10px] px-2 py-0.5 rounded border border-[#64748b]/40 text-[#64748b] font-semibold uppercase tracking-wider">
              SCANNING
            </span>
          )}
          {!isAuthenticated && appState !== 'analyzing' && (
            <button
              onClick={() => { setShowSignIn(!showSignIn); setShowHistory(false); setSignInError('') }}
              className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wider transition-colors ${showSignIn ? 'border-[#39B6FF]/60 text-[#39B6FF]' : 'border-[rgba(57,182,255,0.25)] text-[#39B6FF] hover:border-[#39B6FF]/60'}`}
            >
              Sign In
            </button>
          )}
          {isAuthenticated && (
            <span className="text-[10px] px-2 py-0.5 rounded border border-green-500/30 text-green-400 font-semibold uppercase tracking-wider">
              {userTier === 'pro' ? 'PRO' : userTier === 'team' ? 'TEAM' : 'FREE'}
            </span>
          )}
          {history.length > 0 && appState !== 'analyzing' && !showSignIn && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wider transition-colors ${showHistory ? 'border-[#64748b] text-[#94a3b8]' : 'border-[rgba(57,182,255,0.15)] text-[#64748b] hover:text-[#94a3b8]'}`}
            >
              History ({history.length})
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin relative"
        style={{ background: theme ? theme.bodyBg : '#071C2C', transition: 'background 0.4s ease' }}>

        {/* HISTORY PANEL */}
        {showHistory && (
          <div className="absolute inset-0 top-[49px] bg-[#071c2c] z-10 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgba(57,182,255,0.15)]">
              <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Recent Scans</span>
              <button onClick={() => setShowHistory(false)} className="text-[#64748b] hover:text-[#e2e8f0] text-xs transition-colors">✕ Close</button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0a2338] border border-[rgba(57,182,255,0.15)]">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${RISK_BADGE_DOT[h.risk_level] ?? 'bg-[#64748b]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#e2e8f0] truncate">{h.subject}</p>
                    <p className="text-[10px] text-[#64748b] truncate">{h.fromEmail}</p>
                    <p className="text-[10px] text-[#64748b] mt-0.5">
                      {h.risk_level} · {h.risk_score}/100 · {new Date(h.analyzedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SIGN-IN PANEL */}
        {showSignIn && (
          <div className="absolute inset-0 bg-[#071c2c] z-10 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgba(57,182,255,0.15)]">
              <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Sign In to GuardScope</span>
              <button onClick={() => { setShowSignIn(false); setSignInError('') }} className="text-[#64748b] hover:text-[#e2e8f0] text-xs transition-colors">✕ Close</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <form onSubmit={handleSignIn} className="space-y-3">
                <p className="text-xs text-[#64748b] pb-1">Sign in to track your scans and unlock your quota.</p>
                <input
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 text-xs bg-[#0a2338] border border-[rgba(57,182,255,0.15)] rounded-lg text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:border-[#39B6FF] transition-colors"
                />
                <input
                  type="password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full px-3 py-2.5 text-xs bg-[#0a2338] border border-[rgba(57,182,255,0.15)] rounded-lg text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:border-[#39B6FF] transition-colors"
                />
                {signInError && (
                  <p className="text-[10px] text-[#ef4343]">{signInError}</p>
                )}
                <button
                  type="submit"
                  disabled={signInLoading}
                  className="w-full py-2.5 px-4 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ background: 'linear-gradient(135deg,#39B6FF,#1F8DFF)' }}
                >
                  {signInLoading ? 'Signing in...' : 'Sign In'}
                </button>
                <p className="text-[10px] text-[#64748b] text-center">
                  No account?{' '}
                  <button
                    type="button"
                    onClick={() => chrome.tabs.create({ url: `${BACKEND_URL}/signup` })}
                    className="text-[#39B6FF] hover:underline"
                  >
                    Create one free →
                  </button>
                </p>
                <p className="text-[10px] text-[#64748b] text-center">
                  Have a promo code?{' '}
                  <button
                    type="button"
                    onClick={() => chrome.tabs.create({ url: `${BACKEND_URL}/upgrade` })}
                    className="text-[#39B6FF] hover:underline"
                  >
                    Activate it here →
                  </button>
                </p>
              </form>
            </div>
          </div>
        )}

        {/* PROMO CODE PANEL */}
        {showPromo && (
          <div className="absolute inset-0 bg-[#071c2c] z-10 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgba(57,182,255,0.15)]">
              <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Activate Promo Code</span>
              <button onClick={() => { setShowPromo(false); setPromoError(''); setPromoSuccess(false) }} className="text-[#64748b] hover:text-[#e2e8f0] text-xs transition-colors">✕ Close</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {promoSuccess ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="text-4xl">🎉</div>
                  <p className="text-sm font-semibold text-green-400">Pro activated!</p>
                  <p className="text-xs text-[#64748b]">You now have 30 days of unlimited Pro access.</p>
                </div>
              ) : (
                <form onSubmit={handleRedeemPromo} className="space-y-3">
                  <p className="text-xs text-[#64748b] pb-1">Enter your promo code to unlock 30 days of Pro access.</p>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="GS-XXXX-XXXX"
                    required
                    autoFocus
                    className="w-full px-3 py-2.5 text-xs bg-[#0a2338] border border-[rgba(57,182,255,0.15)] rounded-lg text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:border-[#39B6FF] transition-colors uppercase tracking-widest font-mono"
                  />
                  {promoError && (
                    <p className="text-[10px] text-[#ef4343]">{promoError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={promoLoading || promoCode.length < 4}
                    className="w-full py-2.5 px-4 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ background: 'linear-gradient(135deg,#39B6FF,#1F8DFF)' }}
                  >
                    {promoLoading ? 'Activating...' : 'Activate Code'}
                  </button>
                  <p className="text-[10px] text-[#64748b] text-center">
                    Need a code?{' '}
                    <button
                      type="button"
                      onClick={() => chrome.tabs.create({ url: `${BACKEND_URL}/upgrade` })}
                      className="text-[#39B6FF] hover:underline"
                    >
                      Get early access →
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ANALYZING */}
        {appState === 'analyzing' && (
          <ProgressBar finalScore={pendingScore} />
        )}

        {/* NO EMAIL */}
        {appState === 'no_email' && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
            <div className="text-4xl">📧</div>
            <p className="text-sm font-semibold text-[#e2e8f0]">{t('noEmailTitle')}</p>
            <p className="text-xs text-[#64748b] leading-relaxed">{t('noEmailBody')}</p>
          </div>
        )}

        {/* IDLE */}
        {appState === 'idle' && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
            <div className="text-4xl">🔍</div>
            <p className="text-sm font-semibold text-[#e2e8f0]">{t('idleTitle')}</p>
            {currentEmail?.fromEmail && (
              <p className="text-xs text-[#64748b] truncate w-full">{t('from')}: {currentEmail.fromEmail}</p>
            )}
            <p className="text-xs text-[#64748b] leading-relaxed">{t('idleBody')}</p>
            {!isAuthenticated && (
              <div className="w-full mt-1 pt-3 border-t border-[rgba(57,182,255,0.15)] flex gap-2">
                <button
                  onClick={() => { setShowSignIn(true); setSignInError('') }}
                  className="flex-1 py-1.5 text-center text-[11px] border border-[rgba(57,182,255,0.25)] rounded-lg text-[#39B6FF] hover:bg-[#39B6FF]/10 transition-colors font-semibold"
                >
                  Sign In
                </button>
                <button
                  onClick={() => chrome.tabs.create({ url: `${BACKEND_URL}/signup` })}
                  className="flex-1 py-1.5 text-center text-[11px] border border-[rgba(57,182,255,0.15)] rounded-lg text-[#64748b] hover:text-[#e2e8f0] hover:border-[#64748b] transition-colors"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        )}

        {/* ERROR */}
        {appState === 'error' && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
            <div className="text-4xl">
              {error.includes('internet') || error.includes('reach') ? '📡' :
               error.includes('reload') || error.includes('updated') ? '🔄' :
               error.includes('Open an email') ? '📧' : '⚠️'}
            </div>
            <p className="text-sm font-semibold text-[#e2e8f0]">
              {error.includes('Open an email') ? 'No email selected' :
               error.includes('reload') || error.includes('updated') ? 'Page reload needed' :
               error.includes('internet') || error.includes('reach') ? 'Connection error' :
               'Analysis failed'}
            </p>
            <p className="text-xs text-[#94a3b8] leading-relaxed">{error}</p>
            {!error.includes('reload') && !error.includes('updated') && (
              <button
                onClick={handleRetry}
                className="mt-1 text-xs px-4 py-2 border border-[rgba(57,182,255,0.15)] rounded-lg text-[#64748b] hover:text-[#e2e8f0] hover:border-[#64748b] transition-colors"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {/* LIMIT REACHED */}
        {appState === 'limit_reached' && (() => {
          // Scenario A: pro expired (had pro before, now back to free)
          const proExpired = isAuthenticated && userTier === 'free' && hadPro
          // Scenario B: signed-in free user, promo still available, never had pro
          const showPromoOffer = isAuthenticated && userTier === 'free' && !hadPro && promoAvailable === true
          // Scenario C: signed-in free user, no promos left
          const showUpgradeOnly = isAuthenticated && userTier === 'free' && (promoAvailable === false || hadPro)

          return (
            <div className="flex flex-col h-full p-5 gap-4 overflow-y-auto">
              {/* Header */}
              <div className="text-center pt-2">
                <div className="text-4xl mb-2">{proExpired ? '⏰' : '🔒'}</div>
                <p className="text-sm font-semibold text-[#e2e8f0]">
                  {proExpired ? 'Pro trial ended' : 'Monthly limit reached'}
                </p>
                <p className="text-xs text-[#64748b] leading-relaxed mt-1">
                  {proExpired
                    ? 'Your 30-day free trial has expired. Upgrade to keep unlimited scanning.'
                    : isAuthenticated
                      ? "You've used all 5 free analyses this month."
                      : "You've used all 5 free analyses. Sign in or create an account to continue."}
                </p>
              </div>

              {/* UNAUTHENTICATED — inline sign-in + register + promo teaser */}
              {!isAuthenticated && (
                <div className="space-y-2">
                  <div className="rounded-lg p-3 bg-[#0a2338] border border-[rgba(57,182,255,0.12)] space-y-2.5">
                    <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">Sign in to continue</p>
                    <form onSubmit={handleSignIn} className="space-y-2">
                      <input
                        type="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="Email address"
                        required
                        className="w-full px-3 py-2 text-xs bg-[#071c2c] border border-[rgba(57,182,255,0.15)] rounded-lg text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:border-[#39B6FF] transition-colors"
                      />
                      <input
                        type="password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full px-3 py-2 text-xs bg-[#071c2c] border border-[rgba(57,182,255,0.15)] rounded-lg text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:border-[#39B6FF] transition-colors"
                      />
                      {signInError && <p className="text-[10px] text-[#ef4343]">{signInError}</p>}
                      <button
                        type="submit"
                        disabled={signInLoading}
                        className="w-full py-2 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                        style={{ background: 'linear-gradient(135deg,#39B6FF,#1F8DFF)' }}
                      >
                        {signInLoading ? 'Signing in...' : 'Sign In'}
                      </button>
                    </form>
                    <p className="text-[10px] text-[#64748b] text-center">
                      No account?{' '}
                      <button
                        type="button"
                        onClick={() => chrome.tabs.create({ url: `${BACKEND_URL}/signup` })}
                        className="text-[#39B6FF] hover:underline"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}
                      >
                        Create one free →
                      </button>
                    </p>
                  </div>
                  {promoAvailable !== false && (
                    <div className="rounded-lg p-2.5 bg-[rgba(57,182,255,0.05)] border border-[rgba(57,182,255,0.12)] text-center">
                      <p className="text-[10px] text-[#64748b]">
                        🎁 <span className="text-[#39B6FF] font-semibold">Free promo codes available</span> — sign in to activate 30 days Pro free
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* PRO EXPIRED — upgrade / renew */}
              {proExpired && (
                <div className="space-y-2">
                  <button
                    onClick={() => chrome.tabs.create({ url: `${BACKEND_URL}/upgrade` })}
                    className="w-full py-2.5 text-white text-xs font-semibold rounded-lg transition-colors"
                    style={{ background: 'linear-gradient(135deg,#39B6FF,#1F8DFF)' }}
                  >
                    Upgrade to Pro — $4.99/mo
                  </button>
                  <button
                    onClick={handleRetry}
                    className="w-full py-2 text-[#475569] text-xs hover:text-[#64748b] transition-colors rounded-lg border border-[rgba(57,182,255,0.1)]"
                  >
                    Continue with 5 free/month
                  </button>
                </div>
              )}

              {/* PROMO OFFER — inline code entry for free signed-in users */}
              {showPromoOffer && (
                <div className="space-y-2">
                  <div className="rounded-lg p-3 bg-[rgba(57,182,255,0.06)] border border-[rgba(57,182,255,0.2)] space-y-2.5">
                    <p className="text-[10px] font-semibold text-[#39B6FF] uppercase tracking-wider">🎁 Free 30-day Pro — activate now</p>
                    {promoSuccess ? (
                      <div className="text-center py-1">
                        <p className="text-xs font-semibold text-green-400">🎉 Pro activated! Unlimited scanning for 30 days.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleRedeemPromo} className="space-y-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="Enter promo code  e.g. GS-XXXX-XXXX"
                          required
                          className="w-full px-3 py-2 text-xs bg-[#071c2c] border border-[rgba(57,182,255,0.2)] rounded-lg text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:border-[#39B6FF] transition-colors font-mono tracking-wider uppercase"
                        />
                        {promoError && <p className="text-[10px] text-[#ef4343]">{promoError}</p>}
                        <button
                          type="submit"
                          disabled={promoLoading || promoCode.length < 4}
                          className="w-full py-2 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                          style={{ background: 'linear-gradient(135deg,#39B6FF,#1F8DFF)' }}
                        >
                          {promoLoading ? 'Activating...' : 'Activate Free Pro'}
                        </button>
                      </form>
                    )}
                    <p className="text-[10px] text-[#64748b] text-center">
                      Need a code?{' '}
                      <button
                        type="button"
                        onClick={() => chrome.tabs.create({ url: `${BACKEND_URL}/upgrade` })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}
                        className="text-[#39B6FF] hover:underline"
                      >
                        Request early access →
                      </button>
                    </p>
                  </div>
                  <button
                    onClick={() => chrome.tabs.create({ url: `${BACKEND_URL}/upgrade` })}
                    className="w-full py-2 text-[#39B6FF] text-xs font-semibold rounded-lg border border-[rgba(57,182,255,0.2)] hover:bg-[#39B6FF]/10 transition-colors"
                  >
                    Upgrade to Pro — $4.99/mo
                  </button>
                </div>
              )}

              {/* NO PROMOS LEFT — upgrade only */}
              {showUpgradeOnly && !proExpired && (
                <div className="space-y-2">
                  <button
                    onClick={() => chrome.tabs.create({ url: `${BACKEND_URL}/upgrade` })}
                    className="w-full py-2.5 text-white text-xs font-semibold rounded-lg transition-colors"
                    style={{ background: 'linear-gradient(135deg,#39B6FF,#1F8DFF)' }}
                  >
                    Upgrade to Pro — $4.99/mo
                  </button>
                  <button
                    onClick={handleRetry}
                    className="w-full py-2 text-[#475569] text-xs hover:text-[#64748b] transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              )}

              {/* Loading state while checking promo availability */}
              {isAuthenticated && userTier === 'free' && !hadPro && promoAvailable === null && (
                <div className="text-center py-2">
                  <p className="text-[10px] text-[#64748b]">Checking availability...</p>
                </div>
              )}

              {!isAuthenticated && (
                <button
                  onClick={handleRetry}
                  className="w-full py-1.5 text-[#475569] text-xs hover:text-[#64748b] transition-colors"
                >
                  Maybe later
                </button>
              )}
            </div>
          )
        })()}

        {/* RESULT */}
        {appState === 'result' && report && (
          <div className="px-4 pb-4 space-y-3">

            {/* Risk gauge */}
            <RiskScore score={report.risk_score} level={report.risk_level} />

            {/* Verdict card */}
            <div className={`rounded-lg border p-3.5 ${VERDICT_BORDER_COLORS[report.risk_level]}`}>
              <p className="text-sm text-[#e2e8f0] leading-relaxed">{report.verdict}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span>{VERDICT_ICONS[report.risk_level]}</span>
                <p className={`text-xs font-semibold ${VERDICT_TEXT_COLORS[report.risk_level]}`}>
                  {report.recommendation}
                </p>
              </div>
            </div>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="w-full py-1.5 px-3 border border-[rgba(57,182,255,0.15)] rounded-lg text-[#64748b] text-xs hover:text-[#e2e8f0] hover:border-[#64748b] transition-colors"
            >
              {copied ? t('copied') : t('copyReport')}
            </button>

            {/* Red flags */}
            {report.red_flags.length > 0 && (
              <FlagCard type="red" flags={report.red_flags} />
            )}

            {/* Green flags */}
            {report.green_flags.length > 0 && (
              <FlagCard type="green" flags={report.green_flags} />
            )}

            {/* Technical details */}
            <TechnicalDetails
              modules={report.modules}
              red_flags={report.red_flags}
              green_flags={report.green_flags}
              email={currentEmail ? { fromEmail: currentEmail.fromEmail, subject: currentEmail.subject } : undefined}
            />

            {/* Analysis metadata */}
            <p className="text-[10px] text-[#64748b] text-center">
              {report.analysis_path === 'mercury_deep' ? 'Mercury-2 AI deep scan' :
               report.analysis_path === 'rule_based' ? 'Rule-based fallback' :
               report.analysis_path} · {(report.duration_ms / 1000).toFixed(1)}s
            </p>

            {/* Auth CTA for anonymous users */}
            {!isAuthenticated && (
              <div className="rounded-lg p-3 space-y-2"
                style={{
                  border: `1px solid ${theme ? theme.headerBorder : 'rgba(57,182,255,0.2)'}`,
                  background: theme ? `${theme.btnBg}12` : 'rgba(57,182,255,0.06)',
                }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">
                    Anonymous · {anonCount}/5 free this month
                  </span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="w-4 h-1.5 rounded-full"
                        style={{ background: i <= anonCount ? (theme?.btnBg ?? '#39B6FF') : 'rgba(57,182,255,0.15)' }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowSignIn(true); setSignInError('') }}
                    className="flex-1 py-1.5 text-center text-[11px] font-semibold border border-[rgba(57,182,255,0.25)] rounded-md text-[#39B6FF] hover:bg-[#39B6FF]/10 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => chrome.tabs.create({ url: `${BACKEND_URL}/upgrade` })}
                    className="flex-1 py-1.5 text-center text-[11px] font-semibold rounded-md text-white transition-colors"
                    style={{ background: theme?.btnBg ?? '#39B6FF' }}
                  >
                    Get Early Access
                  </button>
                </div>
              </div>
            )}

            {/* Signed-in free tier CTA */}
            {isAuthenticated && userTier === 'free' && (
              <div className="rounded-lg p-3 flex items-center justify-between gap-3"
                style={{
                  border: `1px solid ${theme ? theme.headerBorder : 'rgba(245,158,11,0.2)'}`,
                  background: theme ? `${theme.btnBg}10` : 'rgba(245,158,11,0.05)',
                }}>
                <p className="text-[11px]" style={{ color: theme?.topBar ?? '#f59e0b' }}>
                  5 free analyses/month
                </p>
                <button
                  onClick={() => { setShowPromo(true); setPromoError('') }}
                  className="text-[11px] font-semibold whitespace-nowrap transition-colors hover:underline"
                  style={{ color: theme?.topBar ?? '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Enter Promo Code →
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 px-4 py-3 space-y-2"
        style={{
          background: theme ? theme.footerBg : '#071C2C',
          borderTop: `1px solid ${theme ? theme.headerBorder : 'rgba(57,182,255,0.15)'}`,
          transition: 'background 0.4s ease, border-color 0.4s ease',
        }}>
        <button
          onClick={appState === 'result' ? handleRetry : handleAnalyze}
          disabled={appState === 'analyzing' || appState === 'no_email' || appState === 'limit_reached'}
          className="w-full py-2.5 px-4 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          style={{
            background: theme ? theme.btnBg : '#39B6FF',
            boxShadow: theme ? `0 2px 14px ${theme.btnGlow}` : 'none',
          }}
        >
          {appState === 'analyzing' ? t('analyzing') :
           appState === 'result' ? t('analyzeAgainBtn') :
           t('analyzeBtn')}
        </button>
        {isAuthenticated && userTier === 'free' && appState !== 'analyzing' && (
          <button
            onClick={() => { setShowPromo(true); setPromoError('') }}
            className="w-full py-1.5 text-[11px] font-semibold text-[#39B6FF] border border-[rgba(57,182,255,0.25)] rounded-lg hover:bg-[#39B6FF]/10 transition-colors"
          >
            🎁 Have a promo code? Activate it here
          </button>
        )}
        <p className="text-[11px] text-[#64748b] text-center">
          {t('poweredBy')}
        </p>
      </div>
    </div>
  )
}

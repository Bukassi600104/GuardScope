import React, { useState, useEffect } from 'react'
import RiskScore from './components/RiskScore'
import FlagCard from './components/FlagCard'
import ProgressBar from './components/ProgressBar'
import TechnicalDetails from './components/TechnicalDetails'
import type { AnalysisReport, AppState } from '../utils/analyze'
import type { ExtractedEmail } from '../utils/emailExtractor'
import { t } from '../utils/i18n'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string

// Shield icon SVG
function ShieldIcon({ color = '#ef4343' }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
        fill={color}
      />
      <path d="M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="white" />
    </svg>
  )
}

const RISK_BADGE_COLORS: Record<string, string> = {
  SAFE:     'border-green-500/40 text-green-400',
  LOW:      'border-lime-500/40 text-lime-400',
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
    topBar: '#84cc16',
    headerBg: 'rgba(22,38,10,0.98)',
    headerBorder: 'rgba(132,204,22,0.3)',
    bodyBg: 'rgba(132,204,22,0.025)',
    footerBg: 'rgba(22,38,10,0.98)',
    btnBg: '#65a30d',
    btnBgHover: '#4d7c0f',
    btnGlow: 'rgba(132,204,22,0.35)',
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
  SAFE: '#22c55e', LOW: '#84cc16', MEDIUM: '#f97316', HIGH: '#ef4343', CRITICAL: '#ef4343',
}

const VERDICT_BORDER_COLORS: Record<string, string> = {
  SAFE:     'border-green-500/30 bg-green-500/8',
  LOW:      'border-lime-500/30 bg-lime-500/8',
  MEDIUM:   'border-orange-500/30 bg-orange-500/8',
  HIGH:     'border-red-500/30 bg-red-500/8',
  CRITICAL: 'border-red-400/40 bg-red-400/10',
}

const VERDICT_TEXT_COLORS: Record<string, string> = {
  SAFE: 'text-green-400', LOW: 'text-lime-400', MEDIUM: 'text-orange-400',
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
  SAFE: 'bg-green-500', LOW: 'bg-lime-500', MEDIUM: 'bg-orange-500', HIGH: 'bg-red-500', CRITICAL: 'bg-red-400',
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

  // On mount: resolve own tabId, then read tab-specific email + shared state
  useEffect(() => {
    // Side panels are associated with a tab — query the active tab in this window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id ?? null
      setMyTabId(tabId)

      const emailKey = tabId ? `guardscope_email_${tabId}` : 'guardscope_current_email'
      chrome.storage.local.get(
        [emailKey, 'guardscope_history', 'guardscope_auth', 'guardscope_anon_count'],
        (result) => {
          const email = result[emailKey] as ExtractedEmail | undefined
          if (email?.fromEmail) {
            setCurrentEmail(email)
            setAppState('idle')
          } else {
            setAppState('no_email')
          }
          setHistory((result.guardscope_history as HistoryEntry[]) ?? [])

          const auth = result.guardscope_auth as { isAuthenticated?: boolean; tier?: string } | undefined
          if (auth?.isAuthenticated) {
            setIsAuthenticated(true)
            setUserTier(auth.tier ?? 'free')
          }
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
        <ShieldIcon color={shieldColor} />
        <span className="font-semibold text-sm tracking-wide">GuardScope</span>

        {/* Right-side controls: badge + history */}
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
          {history.length > 0 && appState !== 'analyzing' && (
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
                <a
                  href={`${BACKEND_URL}/signup`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 text-center text-[11px] border border-[rgba(57,182,255,0.15)] rounded-lg text-[#64748b] hover:text-[#e2e8f0] hover:border-[#64748b] transition-colors"
                >
                  Create free account
                </a>
                <a
                  href={`${BACKEND_URL}/upgrade`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 text-center text-[11px] border border-[#39B6FF]/30 rounded-lg text-[#39B6FF] hover:bg-[#39B6FF]/10 transition-colors"
                >
                  Go Pro — $4.99/mo
                </a>
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
        {appState === 'limit_reached' && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
            <div className="text-4xl">🔒</div>
            <p className="text-sm font-semibold text-[#e2e8f0]">Daily limit reached</p>
            <p className="text-xs text-[#64748b] leading-relaxed">
              You've used all 5 free analyses today.<br />
              Get a promo code for 30 days of unlimited Pro access — free.
            </p>
            <div className="w-full space-y-2 mt-1">
              <a
                href={`${BACKEND_URL}/upgrade`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-2.5 text-white text-xs font-semibold rounded-lg transition-colors"
                style={{ background: 'linear-gradient(135deg,#39B6FF,#1F8DFF)' }}
                onClick={(e) => { e.preventDefault(); chrome.tabs.create({ url: `${BACKEND_URL}/upgrade` }) }}
              >
                Get Early Access — Free 30 Days
              </a>
              {!isAuthenticated && (
                <a
                  href={`${BACKEND_URL}/signup`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 border border-[rgba(57,182,255,0.15)] text-[#64748b] text-xs rounded-lg hover:text-[#e2e8f0] hover:border-[#64748b] transition-colors"
                >
                  Create free account to track usage
                </a>
              )}
              <button
                onClick={handleRetry}
                className="block w-full px-4 py-2 text-[#475569] text-xs hover:text-[#64748b] transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        )}

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
                  <a
                    href={`${BACKEND_URL}/signup`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 text-center text-[11px] font-semibold border border-[rgba(57,182,255,0.15)] rounded-md text-[#e2e8f0] hover:border-[#64748b] transition-colors"
                  >
                    Create free account
                  </a>
                  <a
                    href={`${BACKEND_URL}/upgrade`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 text-center text-[11px] font-semibold rounded-md text-white transition-colors"
                    style={{ background: theme?.btnBg ?? '#39B6FF' }}
                    onClick={(e) => { e.preventDefault(); chrome.tabs.create({ url: `${BACKEND_URL}/upgrade` }) }}
                  >
                    Get Early Access
                  </a>
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
                  5 free analyses/day
                </p>
                <a
                  href={`${BACKEND_URL}/upgrade`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold whitespace-nowrap transition-colors"
                  style={{ color: theme?.topBar ?? '#f59e0b' }}
                  onClick={(e) => { e.preventDefault(); chrome.tabs.create({ url: `${BACKEND_URL}/upgrade` }) }}
                >
                  Get Promo Code →
                </a>
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
        <p className="text-[11px] text-[#64748b] text-center">
          {t('poweredBy')}
        </p>
      </div>
    </div>
  )
}

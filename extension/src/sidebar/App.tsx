import React, { useState, useEffect } from 'react'
import RiskScore from './components/RiskScore'
import FlagCard from './components/FlagCard'
import ProgressBar from './components/ProgressBar'
import TechnicalDetails from './components/TechnicalDetails'
import type { AnalysisReport, AppState } from '../utils/analyze'
import type { ExtractedEmail } from '../utils/emailExtractor'

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

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [error, setError] = useState<string>('')
  const [currentEmail, setCurrentEmail] = useState<ExtractedEmail | null>(null)

  // On mount: check if there's an email in storage
  useEffect(() => {
    chrome.storage.local.get('guardscope_current_email', (result) => {
      const email = result.guardscope_current_email as ExtractedEmail | undefined
      if (email?.fromEmail) {
        setCurrentEmail(email)
        setAppState('idle')
      } else {
        setAppState('no_email')
      }
    })
  }, [])

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

    chrome.runtime.sendMessage({ type: 'ANALYZE' }, (response: {
      success: boolean
      report?: AnalysisReport
      error?: string
      status?: number
    }) => {
      cleanup()

      if (chrome.runtime.lastError) {
        const msg = chrome.runtime.lastError.message ?? 'Extension error'
        if (msg.includes('No email')) {
          setError('Open an email in Gmail first, then click Analyze.')
        } else {
          setError(msg)
        }
        setAppState('error')
        return
      }

      if (!response?.success) {
        if (response?.status === 429) {
          setAppState('limit_reached')
        } else {
          setError(response?.error ?? 'Unknown error')
          setAppState('error')
        }
        return
      }

      if (response.report) {
        setReport(response.report)
        setAppState('result')
      }
    })
  }

  const handleRetry = () => {
    setReport(null)
    setError('')
    setAppState(currentEmail?.fromEmail ? 'idle' : 'no_email')
  }

  const riskLevel = report?.risk_level ?? 'HIGH'
  const shieldColor = appState === 'result' ? SHIELD_COLORS[riskLevel] : '#ef4343'

  return (
    <div className="h-screen bg-[#0f1117] text-[#e2e8f0] font-['Inter',sans-serif] flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#2a2d3a] bg-[#1a1d27] flex-shrink-0">
        <ShieldIcon color={shieldColor} />
        <span className="font-semibold text-sm tracking-wide">GuardScope</span>
        {appState === 'result' && report && (
          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wider ${RISK_BADGE_COLORS[report.risk_level]}`}>
            {report.risk_level}
          </span>
        )}
        {appState === 'analyzing' && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded border border-[#64748b]/40 text-[#64748b] font-semibold uppercase tracking-wider">
            SCANNING
          </span>
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">

        {/* ANALYZING */}
        {appState === 'analyzing' && (
          <div className="p-5">
            <ProgressBar />
          </div>
        )}

        {/* NO EMAIL */}
        {appState === 'no_email' && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
            <div className="text-4xl">📧</div>
            <p className="text-sm font-semibold text-[#e2e8f0]">No email open</p>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Open an email in Gmail, then click "Analyze This Email" to scan it for phishing.
            </p>
          </div>
        )}

        {/* IDLE */}
        {appState === 'idle' && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
            <div className="text-4xl">🔍</div>
            <p className="text-sm font-semibold text-[#e2e8f0]">Ready to analyze</p>
            {currentEmail?.fromEmail && (
              <p className="text-xs text-[#64748b] truncate w-full">From: {currentEmail.fromEmail}</p>
            )}
            <p className="text-xs text-[#64748b] leading-relaxed">
              Click "Analyze This Email" below to run a full security scan.
            </p>
          </div>
        )}

        {/* ERROR */}
        {appState === 'error' && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
            <div className="text-4xl">⚠️</div>
            <p className="text-sm font-semibold text-[#e2e8f0]">Analysis failed</p>
            <p className="text-xs text-[#ef4343] leading-relaxed">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-2 text-xs px-4 py-2 border border-[#2a2d3a] rounded-lg text-[#64748b] hover:text-[#e2e8f0] hover:border-[#64748b] transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* LIMIT REACHED */}
        {appState === 'limit_reached' && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
            <div className="text-4xl">🔒</div>
            <p className="text-sm font-semibold text-[#e2e8f0]">Monthly limit reached</p>
            <p className="text-xs text-[#64748b] leading-relaxed">
              You've used all 5 free analyses this month. Upgrade to Pro for unlimited scans.
            </p>
            <a
              href="https://guardscope.io/upgrade"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 px-4 py-2 bg-[#ef4343] text-white text-xs font-semibold rounded-lg hover:bg-[#dc2626] transition-colors"
            >
              Upgrade to Pro — $4.99/mo
            </a>
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

          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-[#2a2d3a] bg-[#1a1d27] space-y-2">
        <button
          onClick={appState === 'result' ? handleRetry : handleAnalyze}
          disabled={appState === 'analyzing' || appState === 'no_email' || appState === 'limit_reached'}
          className="w-full py-2.5 px-4 bg-[#ef4343] text-white text-sm font-semibold rounded-lg hover:bg-[#dc2626] active:bg-[#b91c1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {appState === 'analyzing' ? 'Analyzing...' :
           appState === 'result' ? 'Analyze Again' :
           'Analyze This Email'}
        </button>
        <p className="text-[11px] text-[#64748b] text-center">
          Powered by Mercury-2 AI
        </p>
      </div>
    </div>
  )
}

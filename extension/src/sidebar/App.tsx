import React, { useState } from 'react'
import RiskScore from './components/RiskScore'
import FlagCard from './components/FlagCard'
import ProgressBar from './components/ProgressBar'
import TechnicalDetails from './components/TechnicalDetails'

// Phase 1 mock data — matches Stitch design "GuardScope Sidebar High Risk Analysis"
// Stitch screen ID: 154bfd27ab354cf8b10a57c9155b1f70
const MOCK_REPORT = {
  riskScore: 72,
  riskLevel: 'HIGH' as const,
  verdict: 'This email shows signs of sender impersonation and contains suspicious links.',
  recommendation: 'Do not click links or reply to this email.',
  redFlags: [
    {
      id: 'rf1',
      label: 'SPF authentication failed',
      detail: 'The sending server is not authorized to send email for this domain. This is a strong indicator of spoofing.',
      severity: 'HIGH' as const,
      module: 'Header Authentication',
    },
    {
      id: 'rf2',
      label: 'Domain registered 4 days ago',
      detail: 'paypa1-secure.com was registered on 2024-12-28 — newly registered domains are a top phishing signal.',
      severity: 'HIGH' as const,
      module: 'Sender Domain Intel',
    },
    {
      id: 'rf3',
      label: 'Display name impersonation detected',
      detail: '"Microsoft Support" <no-reply@paypa1-secure.com> — domain has no relation to Microsoft.',
      severity: 'CRITICAL' as const,
      module: 'Content Analysis',
    },
  ],
  greenFlags: [
    {
      id: 'gf1',
      label: 'DKIM signature valid',
      detail: 'The email has a valid DKIM signature for paypa1-secure.com (though the domain itself is suspicious).',
      module: 'Header Authentication',
    },
    {
      id: 'gf2',
      label: 'No malware detected in links',
      detail: 'VirusTotal scan of 2 URLs returned 0 malicious detections across 70+ engines.',
      module: 'Link Analysis',
    },
  ],
}

// Shield icon SVG — matches Stitch design branding
function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
        fill="#ef4343"
      />
      <path
        d="M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"
        fill="white"
      />
    </svg>
  )
}

export default function App() {
  const [analyzing, setAnalyzing] = useState(false)

  const handleAnalyze = () => {
    setAnalyzing(true)
    setTimeout(() => setAnalyzing(false), 3500)
  }

  return (
    <div className="h-screen bg-[#0f1117] text-[#e2e8f0] font-['Inter',sans-serif] flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#2a2d3a] bg-[#1a1d27] flex-shrink-0">
        <ShieldIcon />
        <span className="font-semibold text-sm tracking-wide">GuardScope</span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded border border-[#ef4343]/40 text-[#ef4343] font-semibold uppercase tracking-wider">
          HIGH RISK
        </span>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {analyzing ? (
          <div className="p-5">
            <ProgressBar />
          </div>
        ) : (
          <div className="px-4 pb-4 space-y-3">

            {/* Risk gauge — Stitch conic gradient design */}
            <RiskScore score={MOCK_REPORT.riskScore} level={MOCK_REPORT.riskLevel} />

            {/* Verdict card */}
            <div className="rounded-lg border border-[#ef4343]/30 bg-[#ef4343]/8 p-3.5">
              <p className="text-sm text-[#e2e8f0] leading-relaxed">{MOCK_REPORT.verdict}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[#ef4343]">🚨</span>
                <p className="text-xs text-[#ef4343] font-semibold">{MOCK_REPORT.recommendation}</p>
              </div>
            </div>

            {/* Red flags */}
            <FlagCard type="red" flags={MOCK_REPORT.redFlags} />

            {/* Green flags */}
            <FlagCard type="green" flags={MOCK_REPORT.greenFlags} />

            {/* Technical details */}
            <TechnicalDetails />

          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-[#2a2d3a] bg-[#1a1d27] space-y-2">
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full py-2.5 px-4 bg-[#ef4343] text-white text-sm font-semibold rounded-lg hover:bg-[#dc2626] active:bg-[#b91c1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {analyzing ? 'Analyzing...' : 'Analyze This Email'}
        </button>
        <p className="text-[11px] text-[#64748b] text-center">
          Powered by Claude AI
        </p>
      </div>
    </div>
  )
}

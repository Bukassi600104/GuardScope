import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../../tailwind.css'

function GuardScopeIcon() {
  const cx = 21, cy = 24, r = 13
  const toR = (d: number) => (d * Math.PI) / 180
  const ax1 = cx + r * Math.cos(toR(30)),  ay1 = cy + r * Math.sin(toR(30))
  const ax2 = cx + r * Math.cos(toR(-30)), ay2 = cy + r * Math.sin(toR(-30))
  const od = r + 7
  const ox = cx + od * Math.cos(toR(-35)), oy = cy + od * Math.sin(toR(-35))
  return (
    <svg width="64" height="64" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="ob-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#72D8FF"/>
          <stop offset="100%" stopColor="#1A8FFF"/>
        </linearGradient>
      </defs>
      <path d={`M ${ax1.toFixed(2)} ${ay1.toFixed(2)} A ${r} ${r} 0 1 1 ${ax2.toFixed(2)} ${ay2.toFixed(2)}`}
        stroke="url(#ob-g)" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
      <circle cx={cx} cy={cy} r="3.5" fill="url(#ob-g)"/>
      <circle cx={ox.toFixed(2)} cy={oy.toFixed(2)} r="3.0" fill="url(#ob-g)"/>
    </svg>
  )
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
        style={{ background: 'linear-gradient(135deg,#39B6FF,#1F8DFF)' }}>
        {number}
      </div>
      <div>
        <p className="text-[#e2e8f0] font-semibold text-sm">{title}</p>
        <p className="text-[#64748b] text-xs mt-0.5">{description}</p>
      </div>
    </div>
  )
}

function CheckRow({ text, green = true }: { text: string; green?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={`text-sm flex-shrink-0 mt-0.5 ${green ? 'text-[#22c55e]' : 'text-[#ef4343]'}`}>
        {green ? '✓' : '✗'}
      </span>
      <span className="text-[#cbd5e1] text-sm">{text}</span>
    </div>
  )
}

function Onboarding() {
  const [activating, setActivating] = useState(false)

  function handleActivate() {
    setActivating(true)
    chrome.storage.local.set({ guardscope_onboarding_complete: true }, () => {
      chrome.tabs.query({ url: 'https://mail.google.com/*' }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.update(tabs[0].id!, { active: true })
          chrome.windows.update(tabs[0].windowId!, { focused: true })
        } else {
          chrome.tabs.create({ url: 'https://mail.google.com' })
        }
        window.close()
      })
    })
  }

  return (
    <div className="min-h-screen bg-[#071c2c] text-[#e2e8f0] font-['Inter',sans-serif] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <GuardScopeIcon />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to GuardScope</h1>
          <p className="text-[#64748b] text-sm">AI-powered email security for Gmail</p>
        </div>

        {/* How it works */}
        <div className="bg-[#0a2338] rounded-xl border border-[rgba(57,182,255,0.15)] p-5 mb-4">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wide mb-4">How it works</h2>
          <div className="space-y-4">
            <Step number={1} title="Open an email in Gmail" description="GuardScope detects the email and a security panel slides in on the right." />
            <Step number={2} title="Click 'Analyze This Email'" description="GuardScope scans the sender, links, and content in seconds using Mercury-2 AI." />
            <Step number={3} title="Read your security report" description="See a risk score, plain-English verdict, and exactly what looks suspicious." />
          </div>
        </div>

        {/* What we check */}
        <div className="bg-[#0a2338] rounded-xl border border-[rgba(57,182,255,0.15)] p-5 mb-4">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wide mb-4">What GuardScope checks</h2>
          <div className="space-y-2.5">
            <CheckRow text="SPF, DKIM, and DMARC authentication records" />
            <CheckRow text="Domain age and registration data" />
            <CheckRow text="URLs against VirusTotal, Safe Browsing, PhishTank, and URLhaus" />
            <CheckRow text="Email content for urgency, impersonation, and phishing patterns" />
            <CheckRow text="Behavioral signals across all modules combined" />
          </div>
        </div>

        {/* What we DON'T store */}
        <div className="bg-[#0d1f14] rounded-xl border border-[#166534]/40 p-5 mb-6">
          <h2 className="text-sm font-semibold text-[#22c55e] uppercase tracking-wide mb-4">What we NEVER store</h2>
          <div className="space-y-2.5">
            <CheckRow text="Email body, subject, or headers — discarded after analysis" green={false} />
            <CheckRow text="Your contacts' email addresses" green={false} />
            <CheckRow text="Your browsing history or activity outside Gmail" green={false} />
            <CheckRow text="Your Gmail password or OAuth token" green={false} />
          </div>
          <p className="text-[#64748b] text-xs mt-3">
            Read our full{' '}
            <a
              href="https://backend-gules-sigma-37.vercel.app/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#22c55e] hover:underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={handleActivate}
          disabled={activating}
          className="w-full py-3 px-6 disabled:opacity-50 text-white font-bold text-base rounded-xl transition-opacity"
          style={{ background: 'linear-gradient(135deg,#39B6FF,#1F8DFF)' }}
        >
          {activating ? 'Opening Gmail...' : 'I Understand — Activate GuardScope'}
        </button>

        <p className="text-center text-[#475569] text-xs mt-4">
          You can uninstall GuardScope at any time from chrome://extensions
        </p>

      </div>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<Onboarding />)

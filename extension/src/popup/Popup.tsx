import React, { useState } from 'react'

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" fill="#ef4343" />
      <path d="M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="white" />
    </svg>
  )
}

export default function Popup() {
  const [clicked, setClicked] = useState(false)

  function handleSignIn() {
    // Phase 1: open Gmail so the sidebar can auto-inject.
    // Real Supabase auth wired in Phase 3.
    chrome.tabs.query({ url: 'https://mail.google.com/*' }, (tabs) => {
      if (tabs.length > 0) {
        // Gmail tab already open — focus it
        chrome.tabs.update(tabs[0].id!, { active: true })
        chrome.windows.update(tabs[0].windowId!, { focused: true })
      } else {
        // No Gmail tab — open one
        chrome.tabs.create({ url: 'https://mail.google.com' })
      }
      window.close()
    })
    setClicked(true)
  }

  return (
    <div className="w-72 bg-[#0f1117] text-[#e2e8f0] font-['Inter',sans-serif]">

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2d3a]">
        <ShieldIcon />
        <span className="font-semibold text-sm">GuardScope</span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded border border-[#2a2d3a] text-[#64748b]">FREE</span>
      </div>

      {/* Status */}
      <div className="px-4 py-3 border-b border-[#2a2d3a]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#64748b]"></div>
          <span className="text-xs text-[#64748b]">Not signed in</span>
        </div>
      </div>

      {/* Usage */}
      <div className="px-4 py-3 border-b border-[#2a2d3a]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-[#64748b]">Monthly analyses</span>
          <span className="text-xs text-[#e2e8f0]">0 / 5</span>
        </div>
        <div className="w-full bg-[#1a1d27] rounded-full h-1.5">
          <div className="bg-[#22c55e] h-1.5 rounded-full" style={{ width: '0%' }}></div>
        </div>
      </div>

      {/* Sign In CTA */}
      <div className="px-4 py-3 space-y-2">
        <button
          onClick={handleSignIn}
          className="w-full py-2 px-4 bg-[#ef4343] text-white text-sm font-semibold rounded-lg hover:bg-[#dc2626] active:bg-[#b91c1c] transition-colors"
        >
          {clicked ? 'Opening Gmail...' : 'Open Gmail to Analyze'}
        </button>
        <p className="text-[10px] text-[#64748b] text-center">
          Sign-in &amp; accounts coming in Phase 3
        </p>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#2a2d3a]">
        <p className="text-[10px] text-[#64748b] text-center">Powered by Claude AI</p>
      </div>
    </div>
  )
}

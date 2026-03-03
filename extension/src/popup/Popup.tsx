import React from 'react'

export default function Popup() {
  return (
    <div className="w-72 bg-gs-bg text-gs-text font-sans">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gs-border">
        <div className="w-6 h-6 rounded bg-gs-high flex items-center justify-center text-white text-xs font-bold">G</div>
        <span className="font-semibold text-sm">GuardScope</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded bg-gs-surface text-gs-muted border border-gs-border">FREE</span>
      </div>

      {/* Status */}
      <div className="px-4 py-3 border-b border-gs-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gs-muted"></div>
          <span className="text-xs text-gs-muted">Not signed in</span>
        </div>
      </div>

      {/* Usage */}
      <div className="px-4 py-3 border-b border-gs-border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gs-muted">Monthly analyses</span>
          <span className="text-xs text-gs-text">0 / 5</span>
        </div>
        <div className="w-full bg-gs-surface rounded-full h-1.5">
          <div className="bg-gs-safe h-1.5 rounded-full" style={{ width: '0%' }}></div>
        </div>
      </div>

      {/* Sign In CTA */}
      <div className="px-4 py-3">
        <button className="w-full py-2 px-4 bg-gs-high text-white text-sm font-medium rounded hover:opacity-90 transition-opacity">
          Sign In to Analyze Emails
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gs-border">
        <p className="text-xs text-gs-muted text-center">Open Gmail to get started</p>
      </div>
    </div>
  )
}

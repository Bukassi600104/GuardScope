import React, { useState } from 'react'

interface Flag {
  id?: string
  label: string
  detail?: string     // green flags from API
  evidence?: string   // red flags from API
  severity?: string
  module: string
}

interface FlagCardProps {
  type: 'red' | 'green'
  flags: Flag[]
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-gs-critical/20 text-red-300 border-gs-critical/40',
  HIGH:     'bg-gs-high/20 text-red-400 border-gs-high/40',
  MEDIUM:   'bg-gs-medium/20 text-orange-400 border-gs-medium/40',
}

export default function FlagCard({ type, flags }: FlagCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isRed = type === 'red'

  const headerColor = isRed
    ? 'border-gs-high/30 bg-gs-high/5 text-gs-high'
    : 'border-gs-safe/30 bg-gs-safe/5 text-gs-safe'

  const icon = isRed ? '🚩' : '✅'
  const title = isRed ? `Red Flags (${flags.length})` : `Green Flags (${flags.length})`

  return (
    <div className={`rounded-lg border ${isRed ? 'border-gs-high/30' : 'border-gs-safe/30'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-3 py-2.5 ${headerColor} rounded-lg ${expanded ? 'rounded-b-none' : ''} transition-colors`}
      >
        <span className="text-sm font-semibold flex items-center gap-2">
          <span>{icon}</span>
          <span>{title}</span>
        </span>
        <span className="text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="divide-y divide-gs-border">
          {flags.map((flag, i) => (
            <div key={flag.id ?? i} className="px-3 py-2.5 bg-gs-surface/50">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-gs-text">{flag.label}</span>
                {flag.severity && (
                  <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${SEVERITY_COLORS[flag.severity] ?? ''}`}>
                    {flag.severity}
                  </span>
                )}
              </div>
              <p className="text-xs text-gs-muted mt-1">{flag.detail ?? flag.evidence ?? ''}</p>
              <p className="text-xs text-gs-muted/60 mt-0.5">Module: {flag.module}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

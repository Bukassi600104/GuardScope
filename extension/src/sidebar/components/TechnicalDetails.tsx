import React, { useState } from 'react'

// Phase 1 placeholder — wired to real data in Phase 3
const MOCK_TECH = {
  headers: {
    'From': 'PayPal Security <no-reply@paypa1-secure.com>',
    'Return-Path': '<bounce@mail7.paypa1-secure.com>',
    'Received': 'from mail7.paypa1-secure.com (198.51.100.42)',
  },
  dns: {
    SPF: 'FAIL — No SPF record found for paypa1-secure.com',
    DKIM: 'NONE — No DKIM signature present',
    DMARC: 'NONE — No DMARC policy configured',
  },
  domain: {
    'Registered': '2024-12-28 (4 days ago)',
    'Registrar': 'Namecheap, Inc.',
    'Risk Classification': 'HIGH — Domain < 30 days old',
  },
  virusTotal: {
    'URLs Scanned': '2',
    'Malicious': '0',
    'Suspicious': '1',
    'Flagging Engines': 'None (suspicious: Forcepoint ThreatSeeker)',
  },
}

export default function TechnicalDetails() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-gs-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-gs-surface text-gs-muted rounded-lg hover:text-gs-text transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-wider">Technical Details</span>
        <span className="text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 bg-gs-surface/30 rounded-b-lg">
          {Object.entries(MOCK_TECH).map(([section, data]) => (
            <div key={section}>
              <p className="text-xs font-semibold text-gs-muted uppercase tracking-wider mb-1.5 mt-3">
                {section === 'dns' ? 'DNS Authentication' :
                 section === 'headers' ? 'Email Headers' :
                 section === 'domain' ? 'Domain Intelligence' :
                 'VirusTotal Scan'}
              </p>
              <div className="space-y-1">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-xs text-gs-muted w-24 flex-shrink-0">{key}:</span>
                    <span className="text-xs text-gs-text break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import type { AnalysisReport } from '../../utils/analyze'

interface TechProps {
  modules?: AnalysisReport['modules']
  email?: { fromEmail: string | null; subject: string | null }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gs-muted w-28 flex-shrink-0">{label}:</span>
      <span className="text-xs text-gs-text break-all">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gs-muted uppercase tracking-wider mb-1.5 mt-3">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

export default function TechnicalDetails({ modules, email }: TechProps) {
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
          {modules ? (
            <>
              {/* DNS Authentication */}
              <Section title="DNS Authentication">
                <Row label="SPF" value={modules.sender_auth.spf} />
                <Row label="DKIM" value={modules.sender_auth.dkim} />
                <Row label="DMARC" value={modules.sender_auth.dmarc} />
              </Section>

              {/* Domain Intelligence */}
              <Section title="Domain Intelligence">
                <Row
                  label="Domain Age"
                  value={
                    modules.domain_intel.age_days !== null
                      ? `${modules.domain_intel.age_days} days`
                      : 'Unknown'
                  }
                />
                <Row label="Risk Level" value={modules.domain_intel.risk_level} />
                {modules.domain_intel.registrar && (
                  <Row label="Registrar" value={modules.domain_intel.registrar} />
                )}
              </Section>

              {/* URL Analysis */}
              <Section title="URL Analysis">
                <Row label="VirusTotal" value={modules.url_analysis.vt_flagged ? 'FLAGGED' : 'Clean'} />
                <Row label="Safe Browsing" value={modules.url_analysis.sb_flagged ? 'FLAGGED' : 'Clean'} />
                {modules.url_analysis.flagged_urls.length > 0 && (
                  <Row label="Flagged URLs" value={modules.url_analysis.flagged_urls.join(', ')} />
                )}
              </Section>

              {/* Content Analysis */}
              <Section title="Content Analysis">
                <Row label="Urgency Score" value={String(modules.content_analysis.urgency_score)} />
                <Row label="Assessment" value={modules.content_analysis.assessment} />
              </Section>

              {/* Sender info if available */}
              {email?.fromEmail && (
                <Section title="Sender">
                  <Row label="Email" value={email.fromEmail} />
                </Section>
              )}
            </>
          ) : (
            /* Fallback mock when no real data */
            <>
              <Section title="DNS Authentication">
                <Row label="SPF" value="— no data —" />
                <Row label="DKIM" value="— no data —" />
                <Row label="DMARC" value="— no data —" />
              </Section>
            </>
          )}
        </div>
      )}
    </div>
  )
}

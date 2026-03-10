import React, { useState } from 'react'
import type { AnalysisReport } from '../../utils/analyze'

interface TechProps {
  modules?: AnalysisReport['modules']
  red_flags?: AnalysisReport['red_flags']
  green_flags?: AnalysisReport['green_flags']
  email?: { fromEmail: string | null; subject: string | null }
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: 'good' | 'bad' | 'warn' }) {
  const colorClass = highlight === 'good' ? 'text-green-400' : highlight === 'bad' ? 'text-red-400' : highlight === 'warn' ? 'text-orange-400' : 'text-gs-text'
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gs-muted w-28 flex-shrink-0">{label}:</span>
      <span className={`text-xs break-all ${colorClass}`}>{value}</span>
    </div>
  )
}

function spfLabel(spf: string): { text: string; highlight: 'good' | 'bad' | 'warn' | undefined } {
  if (spf === 'pass') return { text: 'Verified — sender authorized', highlight: 'good' }
  if (spf === 'fail') return { text: 'Failed — spoofing likely', highlight: 'bad' }
  if (spf === 'softfail') return { text: 'Soft fail — weak protection', highlight: 'warn' }
  if (spf === 'neutral') return { text: 'Permissive — minimal protection', highlight: 'warn' }
  if (spf === 'none') return { text: 'Not configured', highlight: 'warn' }
  return { text: 'Check failed', highlight: undefined }
}

function dkimLabel(dkim: string): { text: string; highlight: 'good' | 'bad' | 'warn' | undefined } {
  if (dkim === 'present') return { text: 'Signing key found', highlight: 'good' }
  if (dkim === 'absent') return { text: 'Not configured', highlight: 'warn' }
  if (dkim === 'unknown') return { text: 'Unverifiable (common)', highlight: undefined }
  return { text: 'Check failed', highlight: undefined }
}

function dmarcLabel(dmarc: string): { text: string; highlight: 'good' | 'bad' | 'warn' | undefined } {
  if (dmarc === 'reject') return { text: 'Enforced — reject unauthorized', highlight: 'good' }
  if (dmarc === 'quarantine') return { text: 'Enforced — quarantine', highlight: 'good' }
  if (dmarc === 'none') return { text: 'Monitor only — no enforcement', highlight: 'warn' }
  return { text: 'Not configured', highlight: 'warn' }
}

function domainRiskLabel(risk: string): { text: string; highlight: 'good' | 'bad' | 'warn' | undefined } {
  if (risk === 'LOW') return { text: 'Established — low risk', highlight: 'good' }
  if (risk === 'MEDIUM') return { text: 'Recently registered', highlight: 'warn' }
  if (risk === 'HIGH') return { text: 'Newly registered — high risk', highlight: 'bad' }
  return { text: 'Unknown', highlight: undefined }
}

function urgencyLabel(score: number): string {
  if (score <= 3) return `${score}/10 — Low`
  if (score <= 6) return `${score}/10 — Moderate`
  return `${score}/10 — High`
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

// Renders flags from a specific module as structured rows
function FlagRows({ flags }: { flags: Array<{ label: string; evidence?: string; detail?: string; severity?: string }> }) {
  return (
    <>
      {flags.map((f, i) => {
        const highlight: 'bad' | 'warn' | 'good' =
          f.severity === 'CRITICAL' || f.severity === 'HIGH' ? 'bad' :
          f.severity === 'MEDIUM' ? 'warn' : 'good'
        return (
          <Row
            key={i}
            label={f.label}
            value={f.evidence ?? f.detail ?? ''}
            highlight={highlight}
          />
        )
      })}
    </>
  )
}

export default function TechnicalDetails({ modules, red_flags, green_flags, email }: TechProps) {
  const [expanded, setExpanded] = useState(false)

  // Extract new-engine signals from red/green flags by module name
  const headerFlags = [
    ...(red_flags ?? []).filter(f => f.module === 'header_integrity'),
    ...(green_flags ?? []).filter(f => f.module === 'header_integrity'),
  ]
  const attachmentFlags = [
    ...(red_flags ?? []).filter(f => f.module === 'attachments'),
    ...(green_flags ?? []).filter(f => f.module === 'attachments'),
  ]
  const domainSimilarityFlags = [
    ...(red_flags ?? []).filter(f => f.module === 'domain_intel' && (
      f.label === 'Lookalike Domain' || f.label?.toLowerCase().includes('lookalike') || f.label?.toLowerCase().includes('typosquat')
    )),
  ]
  const ipUrlFlags = [
    ...(red_flags ?? []).filter(f => f.module === 'url_analysis' && f.label === 'IP Address URL'),
  ]

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
              <Section title="Email Authentication">
                {(() => { const s = spfLabel(modules.sender_auth.spf); return <Row label="SPF" value={s.text} highlight={s.highlight} /> })()}
                {(() => { const d = dkimLabel(modules.sender_auth.dkim); return <Row label="DKIM" value={d.text} highlight={d.highlight} /> })()}
                {(() => { const m = dmarcLabel(modules.sender_auth.dmarc); return <Row label="DMARC" value={m.text} highlight={m.highlight} /> })()}
              </Section>

              {/* Domain Intelligence */}
              <Section title="Sender Domain">
                <Row
                  label="Registered"
                  value={modules.domain_intel.age_days !== null ? `${modules.domain_intel.age_days} days ago` : 'Unknown'}
                />
                {(() => { const r = domainRiskLabel(modules.domain_intel.risk_level); return <Row label="Domain Risk" value={r.text} highlight={r.highlight} /> })()}
                {modules.domain_intel.registrar && (
                  <Row label="Registrar" value={modules.domain_intel.registrar} />
                )}
                {/* Lookalike domain detection results */}
                {domainSimilarityFlags.length > 0 && (
                  <FlagRows flags={domainSimilarityFlags} />
                )}
              </Section>

              {/* Header Integrity — reply-to mismatch, display name impersonation */}
              {headerFlags.length > 0 && (
                <Section title="Header Integrity">
                  <FlagRows flags={headerFlags} />
                </Section>
              )}

              {/* Attachment Risk */}
              {attachmentFlags.length > 0 && (
                <Section title="Attachments">
                  <FlagRows flags={attachmentFlags} />
                </Section>
              )}

              {/* URL Analysis */}
              <Section title="Link Safety">
                <Row
                  label="VirusTotal"
                  value={modules.url_analysis.vt_flagged ? 'Malicious URL detected' : 'No threats found'}
                  highlight={modules.url_analysis.vt_flagged ? 'bad' : 'good'}
                />
                <Row
                  label="Safe Browsing"
                  value={modules.url_analysis.sb_flagged ? 'Threat detected' : 'No threats found'}
                  highlight={modules.url_analysis.sb_flagged ? 'bad' : 'good'}
                />
                {modules.url_analysis.flagged_urls.length > 0 && (
                  <Row label="Flagged Links" value={modules.url_analysis.flagged_urls.join(', ')} highlight="bad" />
                )}
                {/* IP address URLs */}
                {ipUrlFlags.length > 0 && (
                  <FlagRows flags={ipUrlFlags} />
                )}
              </Section>

              {/* Content Analysis */}
              <Section title="Content Analysis">
                <Row label="Urgency" value={urgencyLabel(modules.content_analysis.urgency_score)} />
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

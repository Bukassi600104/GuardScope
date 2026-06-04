'use client'

import { FormEvent, useState } from 'react'
import { GuardScopeLogo } from '../components/GuardScopeLogo'

type Check = {
  label: string
  status: 'ok' | 'watch' | 'missing'
  detail: string
}

type ControlData = {
  generatedAt: string
  listingUrl: string
  websiteUrl: string
  supportEmail: string
  checks: Check[]
  watchTerms: string[]
}

const C = {
  bg: '#f6faff',
  text: '#061b2b',
  body: '#4f6275',
  muted: '#738293',
  border: '#cdd8e3',
  cyan: '#1aa7d9',
  green: '#18a957',
  amber: '#d88b00',
  red: '#d94444',
}

const dailyChecks = [
  'Confirm Chrome Web Store listing opens and Add to Chrome appears.',
  'Search Chrome Web Store for GuardScope and record visibility.',
  'Check whether users report the Enhanced Safe Browsing caution.',
  'Review support@guardscope.app for install, quota, or promo-code issues.',
  'Confirm guardscope.app homepage CTA points to the Chrome Web Store.',
  'Check promo-code requests and remaining inventory.',
  'Review production health and any analysis error spikes.',
]

const launchLinks = [
  { label: 'Chrome Web Store listing', href: 'https://chromewebstore.google.com/detail/guardscope-email-security/fbjajijepjmcmkcidfbmjbjmmegokhif' },
  { label: 'Production website', href: 'https://guardscope.app' },
  { label: 'Privacy policy', href: 'https://guardscope.app/privacy' },
  { label: 'Security documentation', href: 'https://guardscope.app/security' },
  { label: 'Launch-code form', href: 'https://guardscope.app/#early-access' },
]

const docLinks = [
  { label: 'Install instructions', href: 'https://github.com/Bukassi600104/GuardScope/blob/master/docs/INSTALL_GUARDSCOPE.md' },
  { label: 'Launch announcement copy', href: 'https://github.com/Bukassi600104/GuardScope/blob/master/docs/LAUNCH_ANNOUNCEMENT.md' },
  { label: 'Post-launch monitoring', href: 'https://github.com/Bukassi600104/GuardScope/blob/master/docs/POST_LAUNCH_MONITORING.md' },
  { label: 'Chrome Web Store notes', href: 'https://github.com/Bukassi600104/GuardScope/blob/master/docs/CHROME_WEB_STORE_SUBMISSION.md' },
]

function statusColor(status: Check['status']) {
  if (status === 'ok') return C.green
  if (status === 'missing') return C.red
  return C.amber
}

export default function LaunchControlPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<ControlData | null>(null)

  async function loadStatus(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/launch-control/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || 'Unable to load launch control status.')
        setData(null)
        return
      }
      setData(body)
    } catch {
      setError('Unable to reach launch control status.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, padding: '28px 24px 64px' }}>
      <div style={{ width: 'min(1180px, 100%)', margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, marginBottom: 34 }}>
          <a href="/" aria-label="GuardScope home"><GuardScopeLogo variant="dark" size={34} textSize={18} /></a>
          <a href="/" style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: '#fff', color: C.text, padding: '9px 14px', fontSize: 13, fontWeight: 760 }}>Back to site</a>
        </header>

        <section style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
          <p style={{ color: C.cyan, fontSize: 12, fontWeight: 820, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Private launch operations</p>
          <h1 style={{ color: C.text, fontSize: 'clamp(34px,5vw,58px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>GuardScope Launch Control</h1>
          <p style={{ color: C.body, fontSize: 17, lineHeight: 1.7, maxWidth: 760 }}>
            A lightweight post-launch console for install readiness, trust watch items, Chrome Web Store visibility, launch links, and daily operating checks.
          </p>
        </section>

        <form onSubmit={loadStatus} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Launch control password"
            autoComplete="current-password"
            style={{ minHeight: 48, minWidth: 280, flex: '1 1 320px', border: `1px solid ${C.border}`, borderRadius: 8, background: '#fff', color: C.text, padding: '0 14px', font: 'inherit' }}
          />
          <button type="submit" disabled={loading} style={{ minHeight: 48, border: 0, borderRadius: 8, background: C.text, color: '#fff', padding: '0 20px', fontSize: 14, fontWeight: 800, cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? 'Loading...' : 'Load control center'}
          </button>
        </form>

        {error && (
          <div style={{ border: `1px solid rgba(217,68,68,0.32)`, background: '#fff5f5', color: '#8f2525', borderRadius: 8, padding: 16, marginBottom: 24, fontSize: 14 }}>
            {error}
          </div>
        )}

        <div className="control-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
          <section style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: '#fff', padding: 24 }}>
            <h2 style={{ color: C.text, fontSize: 22, marginBottom: 16 }}>Live status</h2>
            {!data ? (
              <p style={{ color: C.body, fontSize: 14, lineHeight: 1.7 }}>Enter the launch control password to load current checks. This page is not linked publicly.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {data.checks.map((check) => (
                  <article key={check.label} style={{ border: `1px solid ${C.border}`, borderLeft: `4px solid ${statusColor(check.status)}`, borderRadius: 8, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                      <h3 style={{ color: C.text, fontSize: 15 }}>{check.label}</h3>
                      <span style={{ color: statusColor(check.status), fontSize: 11, fontWeight: 860, textTransform: 'uppercase' }}>{check.status}</span>
                    </div>
                    <p style={{ color: C.body, fontSize: 13, lineHeight: 1.6 }}>{check.detail}</p>
                  </article>
                ))}
                <p style={{ color: C.muted, fontSize: 12 }}>Last generated: {new Date(data.generatedAt).toLocaleString()}</p>
              </div>
            )}
          </section>

          <aside style={{ display: 'grid', gap: 18 }}>
            <section style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: '#fff', padding: 24 }}>
              <h2 style={{ color: C.text, fontSize: 20, marginBottom: 14 }}>Launch links</h2>
              {launchLinks.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer" style={{ display: 'block', color: C.cyan, fontSize: 14, fontWeight: 760, marginBottom: 10, wordBreak: 'break-word' }}>
                  {link.label}
                </a>
              ))}
            </section>

            <section style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: '#fff', padding: 24 }}>
              <h2 style={{ color: C.text, fontSize: 20, marginBottom: 14 }}>Search watch terms</h2>
              {(data?.watchTerms ?? ['GuardScope', 'GuardScope Email Security', 'GuardScope Gmail']).map((term) => (
                <div key={term} style={{ color: C.body, fontSize: 14, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>{term}</div>
              ))}
            </section>

            <section style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: '#fff', padding: 24 }}>
              <h2 style={{ color: C.text, fontSize: 20, marginBottom: 14 }}>Launch docs</h2>
              {docLinks.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer" style={{ display: 'block', color: C.cyan, fontSize: 14, fontWeight: 760, marginBottom: 10, wordBreak: 'break-word' }}>
                  {link.label}
                </a>
              ))}
            </section>
          </aside>
        </div>

        <section style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: '#fff', padding: 24, marginTop: 18 }}>
          <h2 style={{ color: C.text, fontSize: 22, marginBottom: 14 }}>Daily launch checklist</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
            {dailyChecks.map((item) => (
              <label key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: C.body, fontSize: 14, lineHeight: 1.55, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
                <input type="checkbox" style={{ marginTop: 3 }} />
                {item}
              </label>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

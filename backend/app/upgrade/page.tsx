'use client'
import React, { useState } from 'react'
import { GuardScopeLogo } from '../components/GuardScopeLogo'

const C = {
  navy:    '#071C2C',
  navy2:   '#0a2338',
  cyan:    '#39B6FF',
  cyan2:   '#1F8DFF',
  white:   '#E7EEF4',
  muted:   '#8ba3b8',
  muted2:  '#4a6478',
  success: '#1ED760',
  border:  'rgba(57,182,255,0.15)',
}

function CheckIcon({ color = C.cyan }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 3 }}>
      <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.12"/>
      <path d="M7 12.5L10.5 16L17 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const PRO_FEATURES = [
  'Unlimited email analyses — no daily cap',
  'Full Mercury-2 AI deep scan on every email',
  'VirusTotal + Safe Browsing + PhishTank + URLhaus',
  'DNS authentication (SPF, DKIM, DMARC)',
  'Domain age & registrar intel (RDAP)',
  'Extended analysis history (last 30 scans)',
  'Priority queue — faster analysis',
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(57,182,255,0.05)',
  border: '1px solid rgba(57,182,255,0.2)',
  borderRadius: 10,
  color: C.white,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'Sora, Inter, sans-serif',
}

type View = 'promo' | 'success'

export default function UpgradePage() {
  const [view, setView]       = useState<View>('promo')
  const [code, setCode]       = useState('')
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [proExpiry, setProExpiry] = useState('')

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase().trim(), email: email.trim() }),
      })
      const data = await res.json() as { success?: boolean; proExpiresAt?: string; error?: string }
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Validation failed. Please try again.')
        return
      }
      setProExpiry(data.proExpiresAt ? new Date(data.proExpiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '30 days')
      setView('success')
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.navy, fontFamily: 'Sora, Inter, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center',
        borderBottom: '1px solid rgba(57,182,255,0.1)',
        background: 'rgba(7,28,44,0.9)', backdropFilter: 'blur(16px)',
      }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <GuardScopeLogo size={28} textSize={15} />
        </a>
        <a href="/" style={{ marginLeft: 'auto', fontSize: 13, color: C.muted2, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#4a6478" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to home
        </a>
      </nav>

      {/* Content */}
      <div style={{
        paddingTop: 96, paddingBottom: 80,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        minHeight: '100vh', padding: '96px 24px 80px',
        gap: 40, flexWrap: 'wrap',
      }}>

        {/* Left: features */}
        <div style={{ maxWidth: 340, paddingTop: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: C.cyan, display: 'block', marginBottom: 14 }}>
            GuardScope Pro
          </span>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: C.white, marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Unlimited protection.<br />
            <span style={{
              background: 'linear-gradient(135deg,#6DD5FA,#39B6FF)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>30 days free.</span>
          </h2>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 32 }}>
            Activate your early access code below — no credit card, instant access.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PRO_FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <CheckIcon />
                <span style={{ fontSize: 14, color: C.muted, lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Payment coming soon note */}
          <div style={{
            marginTop: 36,
            background: 'rgba(57,182,255,0.06)',
            border: '1px solid rgba(57,182,255,0.15)',
            borderRadius: 14, padding: '16px 20px',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.cyan, marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
              Payment — Coming Soon
            </p>
            <p style={{ fontSize: 13, color: C.muted2, lineHeight: 1.6, margin: 0 }}>
              Paid subscriptions ($4.99/mo · ₦7,500/mo) will launch after the early access period. Use your promo code to access Pro for free now.
            </p>
          </div>
        </div>

        {/* Right: promo form / success */}
        <div style={{ width: '100%', maxWidth: 440 }}>
          {view === 'promo' ? (
            <div style={{
              background: C.navy2,
              border: '1px solid rgba(57,182,255,0.2)',
              borderRadius: 20, padding: 36,
              position: 'relative' as const,
              boxShadow: '0 0 60px rgba(57,182,255,0.06)',
            }}>
              {/* Top accent */}
              <div style={{
                position: 'absolute', top: -1, left: 0, right: 0, height: 2,
                background: 'linear-gradient(90deg, transparent, #39B6FF, transparent)',
                borderRadius: '20px 20px 0 0',
              }} />

              <h3 style={{ fontSize: 20, fontWeight: 700, color: C.white, marginBottom: 6 }}>
                Activate Promo Code
              </h3>
              <p style={{ fontSize: 14, color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>
                Enter your early access code and the email address you used to create your GuardScope account.
              </p>

              <form onSubmit={handleRedeem} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 7, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                    Promo Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="GS-XXXXXXXX"
                    required
                    style={{
                      ...inputStyle,
                      fontSize: 20, fontWeight: 700,
                      letterSpacing: '0.08em',
                      fontFamily: "'Courier New', monospace",
                      textAlign: 'center' as const,
                      border: '2px solid rgba(57,182,255,0.3)',
                      padding: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 7, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                    Account Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={inputStyle}
                  />
                  <p style={{ fontSize: 12, color: C.muted2, marginTop: 6 }}>
                    Must match your GuardScope account.{' '}
                    <a href="/signup" style={{ color: C.cyan, textDecoration: 'none' }}>No account yet?</a>
                  </p>
                </div>

                {error && (
                  <div style={{
                    fontSize: 13, color: '#ffaaaa',
                    background: 'rgba(255,77,79,0.08)',
                    border: '1px solid rgba(255,77,79,0.2)',
                    borderRadius: 10, padding: '10px 14px',
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !code || !email}
                  style={{
                    padding: '14px',
                    background: loading ? 'rgba(57,182,255,0.4)' : 'linear-gradient(135deg,#39B6FF,#1F8DFF)',
                    color: '#fff', fontWeight: 700, fontSize: 16,
                    borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                    border: 'none', fontFamily: 'Sora, Inter, sans-serif',
                    transition: 'all .2s',
                    boxShadow: '0 4px 20px rgba(57,182,255,0.25)',
                  }}
                >
                  {loading ? 'Activating...' : 'Activate Pro Access'}
                </button>
              </form>

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(57,182,255,0.1)' }}>
                <p style={{ fontSize: 13, color: C.muted2, textAlign: 'center' as const }}>
                  Don&apos;t have a code?{' '}
                  <a href="/#early-access" style={{ color: C.cyan, fontWeight: 600, textDecoration: 'none' }}>
                    Request one free →
                  </a>
                </p>
              </div>
            </div>

          ) : (
            /* Success state */
            <div style={{
              background: C.navy2,
              border: '1px solid rgba(30,215,96,0.25)',
              borderRadius: 20, padding: 36, textAlign: 'center' as const,
              boxShadow: '0 0 60px rgba(30,215,96,0.06)',
            }}>
              <div style={{ position: 'absolute' as const, top: -1, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #1ED760, transparent)', borderRadius: '20px 20px 0 0' }} />

              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(30,215,96,0.1)',
                border: '2px solid rgba(30,215,96,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13L9 17L19 7" stroke="#1ED760" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: C.success, display: 'block', marginBottom: 12 }}>
                Pro Access Active
              </span>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: C.white, marginBottom: 12, lineHeight: 1.2 }}>
                You&apos;re all set! 🎉
              </h2>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 8 }}>
                Your account is now on <strong style={{ color: C.white }}>GuardScope Pro</strong>.
              </p>
              {proExpiry && (
                <p style={{ fontSize: 14, color: C.muted2, marginBottom: 32 }}>
                  Pro access valid until <strong style={{ color: C.white }}>{proExpiry}</strong>.
                </p>
              )}
              <p style={{ fontSize: 14, color: C.muted, marginBottom: 32, lineHeight: 1.6 }}>
                Open <strong style={{ color: C.white }}>Gmail in Chrome</strong>, click the GuardScope icon, and start analyzing emails.
              </p>
              <a
                href="https://mail.google.com"
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '13px 28px',
                  background: 'linear-gradient(135deg,#39B6FF,#1F8DFF)',
                  color: '#fff', fontWeight: 700, fontSize: 15,
                  borderRadius: 12, textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(57,182,255,0.25)',
                }}
              >
                Open Gmail
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            </div>
          )}

          <p style={{ fontSize: 12, color: C.muted2, textAlign: 'center', marginTop: 20 }}>
            By activating you agree to our{' '}
            <a href="/terms" style={{ color: C.muted2, textDecoration: 'underline' }}>Terms of Service</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

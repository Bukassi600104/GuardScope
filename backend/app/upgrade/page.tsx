'use client'
import React, { useState } from 'react'

function ShieldLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" fill="#ef4444"/>
      <path d="M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="white"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M20 6L9 17L4 12" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const PRO_FEATURES = [
  'Unlimited email analyses',
  'Full Mercury-2 AI deep scan on every email',
  'VirusTotal + Safe Browsing + PhishTank + URLhaus',
  'DNS authentication (SPF, DKIM, DMARC)',
  'Domain age & registrar intel',
  'Analysis history (last 30 scans)',
  'Email support',
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: '#13151f',
  border: '1px solid #2a2d3a',
  borderRadius: 10,
  color: '#e2e8f0',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

export default function UpgradePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePaystack(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Payment initialization failed — please try again')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Nav */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', borderBottom: '1px solid #1a1d27', background: 'rgba(15,17,23,0.95)', backdropFilter: 'blur(8px)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <ShieldLogo />
          <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>GuardScope</span>
        </a>
        <a href="/" style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b', textDecoration: 'none' }}>← Back to home</a>
      </div>

      <div style={{ maxWidth: 520, width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 999, marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>Upgrade to Pro</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>
            Unlimited protection,<br />one simple price
          </h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>Cancel anytime · Instant activation</p>
        </div>

        {/* Pricing card */}
        <div style={{ background: '#1a0d0d', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 20, padding: 32, marginBottom: 24, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 999, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            MOST POPULAR
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1 }}>$4.99</span>
            <span style={{ fontSize: 15, color: '#fca5a5' }}>/month</span>
          </div>
          <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 28 }}>or ₦7,500/month via Paystack</p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
            {PRO_FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <CheckIcon />
                <span style={{ fontSize: 14, color: '#fecaca', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Payment form */}
          <form onSubmit={handlePaystack} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 7 }}>
                Your email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{ ...inputStyle, border: '1px solid rgba(239,68,68,0.3)' }}
              />
              <p style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>
                Must match your GuardScope account email. No account yet?{' '}
                <a href="/signup" style={{ color: '#ef4444', textDecoration: 'none' }}>Create one free →</a>
              </p>
            </div>

            {error && (
              <p style={{ fontSize: 13, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ padding: '14px', background: loading ? '#7f1d1d' : '#ef4444', color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', fontFamily: 'inherit', transition: 'background .2s' }}
            >
              {loading ? 'Redirecting to payment...' : 'Pay with Paystack — ₦7,500/mo'}
            </button>

            <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', margin: 0 }}>
              Secured by Paystack · SSL encrypted · Cancel anytime
            </p>
          </form>
        </div>

        {/* USD option note */}
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 14, padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Prefer to pay in USD ($4.99/mo)?</p>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            Open the GuardScope extension in Chrome, click <strong style={{ color: '#e2e8f0' }}>"Upgrade to Pro"</strong> in the popup — it will launch a Stripe checkout directly linked to your account.
          </p>
        </div>

        {/* Trust */}
        <p style={{ fontSize: 12, color: '#334155', textAlign: 'center', marginTop: 24, lineHeight: 1.7 }}>
          By upgrading you agree to our{' '}
          <a href="/terms" style={{ color: '#475569', textDecoration: 'underline' }}>Terms of Service</a>.
          {' '}Your Pro access activates instantly after payment.
        </p>
      </div>
    </div>
  )
}

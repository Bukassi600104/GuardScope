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

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Registration failed')
        return
      }
      setSuccess(true)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Account created!</h1>
          <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            Your GuardScope account is ready. Open the extension popup, click the shield icon in your toolbar, and sign in with your new credentials.
          </p>
          <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 14, padding: 24, marginBottom: 28, textAlign: 'left' }}>
            <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 16 }}>Next steps</p>
            {[
              'Install the GuardScope Chrome extension',
              'Click the GuardScope shield in your Chrome toolbar',
              'Sign in with your email and password',
              'Open any email in Gmail and click "Analyze This Email"',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 3 ? 12 : 0, alignItems: 'flex-start' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
          <a
            href="https://chromewebstore.google.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 12, textDecoration: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2"/><circle cx="12" cy="12" r="3.5" fill="white"/></svg>
            Install GuardScope — Free
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Nav */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', borderBottom: '1px solid #1a1d27', background: 'rgba(15,17,23,0.95)', backdropFilter: 'blur(8px)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <ShieldLogo />
          <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>GuardScope</span>
        </a>
      </div>

      <div style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <ShieldLogo />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Create your account</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Free — 5 analyses/month · No credit card needed</p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ padding: '13px', background: loading ? '#7f1d1d' : '#ef4444', color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', fontFamily: 'inherit', transition: 'background .2s' }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p style={{ fontSize: 13, color: '#475569', textAlign: 'center', margin: 0 }}>
            Already have an account?{' '}
            <a href="/" style={{ color: '#ef4444', textDecoration: 'none' }}>Back to home</a>
          </p>
        </form>

        <p style={{ fontSize: 12, color: '#334155', textAlign: 'center', marginTop: 20, lineHeight: 1.7 }}>
          By signing up you agree to our{' '}
          <a href="/terms" style={{ color: '#475569', textDecoration: 'underline' }}>Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" style={{ color: '#475569', textDecoration: 'underline' }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}

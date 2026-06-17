'use client'

import type { FormEvent, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { GuardScopeLogo } from '../components/GuardScopeLogo'

const C = {
  bg: '#f6faff',
  panel: '#ffffff',
  text: '#001e2f',
  body: '#526477',
  muted: '#6e7882',
  border: '#c8d4df',
  cyan: '#0d8ec2',
  success: '#168a45',
  danger: '#be3030',
}

const fieldStyle = {
  width: '100%',
  height: 48,
  borderRadius: 8,
  border: `1px solid ${C.border}`,
  background: '#fff',
  padding: '0 14px',
  fontSize: 14,
  color: C.text,
  outline: 'none',
} as const

function Alert({ tone, children }: { tone: 'error' | 'success' | 'info'; children: ReactNode }) {
  const color = tone === 'error' ? C.danger : tone === 'success' ? C.success : C.cyan
  const bg = tone === 'error' ? 'rgba(255,77,79,0.08)' : tone === 'success' ? 'rgba(30,215,96,0.08)' : 'rgba(57,182,255,0.09)'
  return (
    <div style={{ border: `1px solid ${color}33`, background: bg, borderRadius: 8, padding: '12px 14px', fontSize: 13, color, lineHeight: 1.55 }}>
      {children}
    </div>
  )
}

export default function ResetPasswordPage() {
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const type = params.get('type')

    if (accessToken && type === 'recovery') {
      setToken(accessToken)
    } else {
      setInvalidLink(true)
    }
  }, [])

  async function handleReset(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 12) {
      setError('Password must be at least 12 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Unable to reset password. Please request a new reset link.')
        return
      }

      setSuccess(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, padding: '28px 24px 54px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 52 }}>
          <a href="/" aria-label="GuardScope home"><GuardScopeLogo variant="dark" size={32} textSize={17} /></a>
          <a href="/signup" style={{ border: `1px solid ${C.border}`, background: '#fff', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 760, color: C.text }}>Sign in</a>
        </nav>

        <section style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: C.panel, padding: '34px', boxShadow: '0 24px 70px rgba(0,30,47,0.08)' }}>
          <p style={{ fontSize: 12, fontWeight: 820, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cyan, marginBottom: 12 }}>Account security</p>
          <h1 style={{ fontSize: 'clamp(30px,5vw,48px)', lineHeight: 1.08, letterSpacing: '-0.02em', color: C.text, marginBottom: 12 }}>
            Reset your GuardScope password.
          </h1>
          <p style={{ fontSize: 15, color: C.body, lineHeight: 1.75, marginBottom: 24 }}>
            Choose a new password for your account. This only changes your GuardScope login and does not affect Gmail.
          </p>

          {invalidLink && (
            <div style={{ display: 'grid', gap: 16 }}>
              <Alert tone="error">This password reset link is invalid or expired. Request a new link from the sign-in page.</Alert>
              <a href="/signup" style={{ display: 'grid', placeItems: 'center', height: 50, borderRadius: 8, background: C.text, color: '#fff', fontWeight: 820, fontSize: 14 }}>Back to sign in</a>
            </div>
          )}

          {!invalidLink && !success && (
            <form onSubmit={handleReset} style={{ display: 'grid', gap: 14 }}>
              {error && <Alert tone="error">{error}</Alert>}
              <label style={{ display: 'grid', gap: 7, fontSize: 13, fontWeight: 700, color: C.text }}>
                New password
                <input style={fieldStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} autoComplete="new-password" placeholder="At least 12 characters" />
              </label>
              <label style={{ display: 'grid', gap: 7, fontSize: 13, fontWeight: 700, color: C.text }}>
                Confirm password
                <input style={fieldStyle} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={12} autoComplete="new-password" placeholder="Re-enter your password" />
              </label>
              <Alert tone="info">Use a unique password with at least 12 characters. This matches the GuardScope account creation policy.</Alert>
              <button type="submit" disabled={loading} style={{ height: 50, borderRadius: 8, background: C.text, color: '#fff', fontWeight: 820, fontSize: 14, opacity: loading ? 0.72 : 1 }}>
                {loading ? 'Updating password...' : 'Update password'}
              </button>
            </form>
          )}

          {success && (
            <div style={{ display: 'grid', gap: 16 }}>
              <Alert tone="success">Your password has been updated. You can now sign in with the new password.</Alert>
              <a href="/signup" style={{ display: 'grid', placeItems: 'center', height: 50, borderRadius: 8, background: C.text, color: '#fff', fontWeight: 820, fontSize: 14 }}>Go to sign in</a>
            </div>
          )}

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
            <a href="/security" style={{ color: C.cyan, fontSize: 13, fontWeight: 760 }}>Read security documentation</a>
          </div>
        </section>
      </div>
    </main>
  )
}

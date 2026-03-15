'use client'
import React, { useState, useEffect } from 'react'


const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: '#0a1628',
  border: '1px solid rgba(57,182,255,0.2)',
  borderRadius: 10,
  color: '#e2e8f0',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

export default function ResetPasswordPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)

  // Extract access_token from URL hash — Supabase puts it there after redirect
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const token = params.get('access_token')
    const type = params.get('type')
    if (token && type === 'recovery') {
      setAccessToken(token)
    } else {
      setInvalidLink(true)
    }
  }, [])

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
    if (!accessToken) {
      setError('Invalid or expired reset link')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, password }),
      })
      const data = await res.json().catch(() => ({})) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Reset failed — your link may have expired')
        return
      }
      setSuccess(true)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: '#071C2C',
    fontFamily: 'Sora, Inter, sans-serif',
  }

  if (invalidLink) {
    return (
      <div style={containerStyle}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Invalid reset link</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
            This link is invalid or has expired. Password reset links are valid for 1 hour.
          </p>
          <a
            href="/signup"
            style={{ display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg,#39B6FF,#1F8DFF)', color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 10, textDecoration: 'none' }}
          >
            Request a new link
          </a>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Password updated!</h1>
          <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
            Your password has been reset. You can now sign in with your new password in the GuardScope extension.
          </p>
          <a
            href="/signup"
            style={{ display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg,#39B6FF,#1F8DFF)', color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 10, textDecoration: 'none' }}
          >
            Back to Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Set new password</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Choose a strong password for your GuardScope account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ background: '#0d1f35', border: '1px solid rgba(57,182,255,0.15)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>New password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoFocus
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Confirm new password</label>
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
            <p style={{ fontSize: 13, color: '#ef4343', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !accessToken}
            style={{ padding: '13px', background: loading ? 'rgba(57,182,255,0.4)' : 'linear-gradient(135deg,#39B6FF,#1F8DFF)', color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', fontFamily: 'inherit', transition: 'opacity .2s' }}
          >
            {loading ? 'Updating password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

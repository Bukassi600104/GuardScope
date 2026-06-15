'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useState } from 'react'

const C = {
  ink: '#061b2b',
  border: 'rgba(255,255,255,0.16)',
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function fieldStyle(): CSSProperties {
  return {
    width: '100%',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    minHeight: 46,
    padding: '0 13px',
    color: '#fff',
    background: 'rgba(255,255,255,0.08)',
    font: 'inherit',
    outline: 'none',
  }
}

function Alert({ tone, children }: { tone: 'error' | 'success'; children: string }) {
  const isError = tone === 'error'
  return (
    <div style={{
      border: `1px solid ${isError ? 'rgba(255,120,120,0.38)' : 'rgba(84,225,142,0.38)'}`,
      background: isError ? 'rgba(255,80,80,0.13)' : 'rgba(53,190,108,0.14)',
      color: '#fff',
      borderRadius: 8,
      padding: 12,
      fontSize: 13,
      lineHeight: 1.55,
    }}>
      {children}
    </div>
  )
}

export function LaunchCodeForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [company, setCompany] = useState('')
  const [startedAt, setStartedAt] = useState(() => Date.now())

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setCode('')
    setCopied(false)
    setLoading(true)

    try {
      const res = await fetch('/api/promo/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, country, company, startedAt }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body.error || 'Unable to claim a launch code right now. Please try again shortly.')
        return
      }

      setMessage(body.message || 'Your promo code is on its way. Check your inbox and spam folder.')
      if (typeof body.code === 'string' && body.code) {
        setCode(body.code)
      }
      setName('')
      setEmail('')
      setCountry('')
      setCompany('')
      setStartedAt(Date.now())
    } catch {
      setError('Unable to reach the launch-code service. Please try again shortly.')
    } finally {
      setLoading(false)
    }
  }

  async function copyCode() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
      <input
        type="text"
        name="company"
        value={company}
        onChange={(event) => setCompany(event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: -10000, width: 1, height: 1, opacity: 0 }}
      />
      <input type="hidden" name="startedAt" value={startedAt} readOnly />

      <label style={{ display: 'grid', gap: 7, fontSize: 12, fontWeight: 760, color: 'rgba(255,255,255,0.72)' }}>
        Full name
        <input value={name} onChange={(event) => setName(event.target.value)} type="text" required placeholder="Tony Adebayo" style={fieldStyle()} />
      </label>

      <label style={{ display: 'grid', gap: 7, fontSize: 12, fontWeight: 760, color: 'rgba(255,255,255,0.72)' }}>
        Email address
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required placeholder="tony@example.com" style={fieldStyle()} />
      </label>

      <label style={{ display: 'grid', gap: 7, fontSize: 12, fontWeight: 760, color: 'rgba(255,255,255,0.72)' }}>
        Country
        <input value={country} onChange={(event) => setCountry(event.target.value)} type="text" required placeholder="Nigeria" style={fieldStyle()} />
      </label>

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      {code && (
        <div style={{
          display: 'grid',
          gap: 12,
          border: '1px solid rgba(84,225,142,0.42)',
          background: 'rgba(3,24,38,0.48)',
          borderRadius: 8,
          padding: 14,
          color: '#fff',
        }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 760, color: 'rgba(255,255,255,0.68)' }}>Your launch code</span>
            <strong style={{ fontSize: 24, letterSpacing: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{code}</strong>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={copyCode}
              style={{
                minHeight: 40,
                padding: '0 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontWeight: 760,
                cursor: 'pointer',
              }}
            >
              {copied ? 'Copied' : 'Copy code'}
            </button>
            <a
              href="/upgrade"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: 40,
                padding: '0 14px',
                borderRadius: 8,
                background: '#fff',
                color: C.ink,
                textDecoration: 'none',
                fontWeight: 760,
              }}
            >
              Use code
            </a>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          minHeight: 48,
          padding: '0 22px',
          borderRadius: 8,
          border: 0,
          background: '#fff',
          color: C.ink,
          fontSize: 15,
          fontWeight: 760,
          boxShadow: '0 16px 34px rgba(6,27,43,0.18)',
          marginTop: 4,
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.72 : 1,
        }}
      >
        {loading ? 'Claiming...' : 'Claim a launch code'}
        <ArrowIcon />
      </button>
    </form>
  )
}

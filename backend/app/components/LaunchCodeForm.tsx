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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const res = await fetch('/api/promo/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, country }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body.error || 'Unable to claim a launch code right now. Please try again shortly.')
        return
      }

      setMessage(body.message || 'Your promo code is on its way. Check your inbox and spam folder.')
      setName('')
      setEmail('')
      setCountry('')
    } catch {
      setError('Unable to reach the launch-code service. Please try again shortly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
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

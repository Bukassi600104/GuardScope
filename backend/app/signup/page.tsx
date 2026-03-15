'use client'
import React, { useState } from 'react'

function GuardScopeIcon() {
  const cx = 21, cy = 24, r = 13
  const toR = (d: number) => (d * Math.PI) / 180
  const ax1 = cx + r * Math.cos(toR(30)),  ay1 = cy + r * Math.sin(toR(30))
  const ax2 = cx + r * Math.cos(toR(-30)), ay2 = cy + r * Math.sin(toR(-30))
  const od = r + 4
  const ox = cx + od * Math.cos(toR(0)), oy = cy + od * Math.sin(toR(0))
  return (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="gs-auth-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#72D8FF"/>
          <stop offset="100%" stopColor="#1A8FFF"/>
        </linearGradient>
      </defs>
      <path d={`M ${ax1.toFixed(2)} ${ay1.toFixed(2)} A ${r} ${r} 0 1 1 ${ax2.toFixed(2)} ${ay2.toFixed(2)}`}
        stroke="url(#gs-auth-g)" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
      <circle cx={cx} cy={cy} r="3.5" fill="url(#gs-auth-g)"/>
      <circle cx={ox.toFixed(2)} cy={oy.toFixed(2)} r="3.0" fill="url(#gs-auth-g)"/>
    </svg>
  )
}

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

type View = 'signin' | 'signup' | 'forgot' | 'forgot_sent' | 'signup_success'

export default function AuthPage() {
  const [view, setView] = useState<View>('signup')

  // Sign up state
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  // Sign in state
  const [signinEmail, setSigninEmail] = useState('')
  const [signinPassword, setSigninPassword] = useState('')
  const [signinLoading, setSigninLoading] = useState(false)
  const [signinError, setSigninError] = useState('')

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setSignupError('')
    if (signupPassword !== signupConfirm) { setSignupError('Passwords do not match'); return }
    if (signupPassword.length < 8) { setSignupError('Password must be at least 8 characters'); return }
    setSignupLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupEmail, password: signupPassword }),
      })
      const data = await res.json() as { error?: string; needsConfirmation?: boolean }
      if (!res.ok) {
        if (res.status === 409) {
          setSignupError('An account with this email already exists.')
          setSigninEmail(signupEmail)
        } else {
          setSignupError(data.error ?? 'Registration failed')
        }
        return
      }
      setNeedsConfirmation(!!data.needsConfirmation)
      setView('signup_success')
    } catch {
      setSignupError('Network error — please try again')
    } finally {
      setSignupLoading(false)
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setSigninError('')
    setSigninLoading(true)
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signinEmail, password: signinPassword }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setSigninError(data.error ?? 'Invalid email or password')
        return
      }
      // Sign-in confirmed — redirect home
      window.location.href = '/'
    } catch {
      setSigninError('Network error — please try again')
    } finally {
      setSigninLoading(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setForgotError('')
    setForgotLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setForgotError(data.error ?? 'Failed to send reset email')
        return
      }
      setView('forgot_sent')
    } catch {
      setForgotError('Network error — please try again')
    } finally {
      setForgotLoading(false)
    }
  }

  const page: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: '#071C2C',
    fontFamily: 'Sora, Inter, sans-serif',
  }

  const card: React.CSSProperties = {
    background: '#0d1f35',
    border: '1px solid rgba(57,182,255,0.15)',
    borderRadius: 16,
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  }

  const btn = (primary: boolean, disabled?: boolean): React.CSSProperties => ({
    padding: '13px',
    background: disabled ? 'rgba(57,182,255,0.3)' : primary ? 'linear-gradient(135deg,#39B6FF,#1F8DFF)' : 'transparent',
    color: primary ? '#fff' : '#39B6FF',
    fontWeight: 700,
    fontSize: 15,
    borderRadius: 10,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: primary ? 'none' : '1px solid rgba(57,182,255,0.3)',
    fontFamily: 'inherit',
    transition: 'opacity .2s',
    width: '100%',
  })

  const errorBox: React.CSSProperties = {
    fontSize: 13,
    color: '#ef4343',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 8,
    padding: '10px 14px',
    margin: 0,
  }

  // ── Success: account created ──
  if (view === 'signup_success') {
    return (
      <div style={page}>
        <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
            {needsConfirmation ? 'Check your email!' : 'Account created!'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
            {needsConfirmation
              ? `We sent a confirmation link to ${signupEmail}. Click it to activate your account, then sign in with the extension.`
              : 'Your GuardScope account is ready. Open the extension, click Sign In, and enter your credentials.'}
          </p>
          <button onClick={() => setView('signin')} style={{ ...btn(true), width: 'auto', display: 'inline-block', padding: '12px 28px' }}>
            Sign In Now →
          </button>
        </div>
      </div>
    )
  }

  // ── Forgot password sent ──
  if (view === 'forgot_sent') {
    return (
      <div style={page}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Reset email sent</h1>
          <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
            If an account exists for <strong style={{ color: '#e2e8f0' }}>{forgotEmail}</strong>, you&apos;ll receive a password reset link shortly. Check your spam folder if it doesn&apos;t arrive.
          </p>
          <button onClick={() => setView('signin')} style={{ ...btn(false), width: 'auto', display: 'inline-block', padding: '12px 28px' }}>
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={page}>
      {/* Nav */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(57,182,255,0.1)', background: 'rgba(7,28,44,0.95)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <GuardScopeIcon />
          <span style={{ fontWeight: 800, fontSize: 16, color: '#E7EEF4', fontFamily: 'Sora, Inter, sans-serif' }}>
            Guard<span style={{ color: '#39B6FF' }}>Scope</span>
          </span>
        </a>
      </div>

      <div style={{ maxWidth: 420, width: '100%', marginTop: 60 }}>

        {/* ── Forgot password form ── */}
        {view === 'forgot' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Reset your password</h1>
              <p style={{ color: '#64748b', fontSize: 14 }}>Enter your email and we&apos;ll send a reset link</p>
            </div>
            <form onSubmit={handleForgotPassword} style={card}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Email address</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  style={inputStyle}
                />
              </div>
              {forgotError && <p style={errorBox}>{forgotError}</p>}
              <button type="submit" disabled={forgotLoading} style={btn(true, forgotLoading)}>
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setView('signin')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                ← Back to Sign In
              </button>
            </form>
          </>
        )}

        {/* ── Sign In / Sign Up tabs ── */}
        {(view === 'signin' || view === 'signup') && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <GuardScopeIcon />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                {view === 'signin' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                {view === 'signin' ? 'Sign in to your GuardScope account' : 'Free — 5 analyses/month · No credit card needed'}
              </p>
            </div>

            {/* Tab switcher */}
            <div style={{ display: 'flex', background: '#0a1628', borderRadius: 10, padding: 4, marginBottom: 20, border: '1px solid rgba(57,182,255,0.1)' }}>
              {(['signin', 'signup'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setView(tab)}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: 8,
                    border: 'none',
                    fontFamily: 'inherit',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all .2s',
                    background: view === tab ? 'rgba(57,182,255,0.15)' : 'transparent',
                    color: view === tab ? '#39B6FF' : '#64748b',
                  }}
                >
                  {tab === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Sign In form */}
            {view === 'signin' && (
              <form onSubmit={handleSignIn} style={card}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Email address</label>
                  <input
                    type="email"
                    value={signinEmail}
                    onChange={e => setSigninEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    style={inputStyle}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Password</label>
                    <button
                      type="button"
                      onClick={() => { setForgotEmail(signinEmail); setView('forgot') }}
                      style={{ background: 'none', border: 'none', color: '#39B6FF', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={signinPassword}
                    onChange={e => setSigninPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    style={inputStyle}
                  />
                </div>
                {signinError && <p style={errorBox}>{signinError}</p>}
                <button type="submit" disabled={signinLoading} style={btn(true, signinLoading)}>
                  {signinLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            {/* Sign Up form */}
            {view === 'signup' && (
              <form onSubmit={handleSignUp} style={card}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Email address</label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
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
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
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
                    value={signupConfirm}
                    onChange={e => setSignupConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    style={inputStyle}
                  />
                </div>
                {signupError && (
                  <p style={errorBox}>
                    {signupError}
                    {signupError.includes('already exists') && (
                      <> {' '}
                        <button
                          type="button"
                          onClick={() => { setSigninEmail(signupEmail); setView('signin') }}
                          style={{ background: 'none', border: 'none', color: '#39B6FF', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 0, textDecoration: 'underline' }}
                        >
                          Sign in instead →
                        </button>
                      </>
                    )}
                  </p>
                )}
                <button type="submit" disabled={signupLoading} style={btn(true, signupLoading)}>
                  {signupLoading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            )}

            <p style={{ fontSize: 12, color: '#334155', textAlign: 'center', marginTop: 20, lineHeight: 1.7 }}>
              By signing up you agree to our{' '}
              <a href="/terms" style={{ color: '#475569', textDecoration: 'underline' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" style={{ color: '#475569', textDecoration: 'underline' }}>Privacy Policy</a>.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

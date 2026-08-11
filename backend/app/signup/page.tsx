'use client'

import type { FormEvent, ReactNode } from 'react'
import { useState } from 'react'
import { GuardScopeLogo } from '../components/GuardScopeLogo'
import { CTA_HREF, CTA_LABEL } from '../../lib/launch'

type View = 'signin' | 'signup' | 'forgot' | 'forgot_sent' | 'signup_success'

const C = {
  bg: '#06131f',
  panel: '#ffffff',
  text: '#001e2f',
  body: '#526477',
  muted: '#6e7882',
  border: '#c8d4df',
  cyan: '#0d8ec2',
  success: '#168a45',
  warning: '#ad6b00',
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

const labelStyle = {
  display: 'grid',
  gap: 7,
  fontSize: 13,
  fontWeight: 700,
  color: C.text,
} as const

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 17L17 7M17 7H8M17 7v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Alert({ tone, children }: { tone: 'error' | 'success' | 'info'; children: ReactNode }) {
  const color = tone === 'error' ? C.danger : tone === 'success' ? C.success : C.cyan
  const bg = tone === 'error' ? 'rgba(255,77,79,0.08)' : tone === 'success' ? 'rgba(30,215,96,0.08)' : 'rgba(57,182,255,0.09)'
  return (
    <div style={{ border: `1px solid ${color}33`, background: bg, borderRadius: 8, padding: '12px 14px', fontSize: 13, color, lineHeight: 1.55 }}>
      {children}
    </div>
  )
}

export default function SignupPage() {
  const [view, setView] = useState<View>('signin')

  const [signinEmail, setSigninEmail] = useState('')
  const [signinPassword, setSigninPassword] = useState('')
  const [signinLoading, setSigninLoading] = useState(false)
  const [signinError, setSigninError] = useState('')

  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [signupNeedsConfirmation, setSignupNeedsConfirmation] = useState(false)

  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')

  async function handleSignUp(e: FormEvent) {
    e.preventDefault()
    setSignupError('')
    if (signupPassword.length < 12) {
      setSignupError('Password must be at least 12 characters.')
      return
    }

    setSignupLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupEmail, password: signupPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setSignupError('An account with this email already exists. Sign in instead.')
        } else {
          setSignupError(data.error || 'Unable to create account. Please try again.')
        }
        return
      }

      setSignupNeedsConfirmation(Boolean(data.needsConfirmation))
      setView('signup_success')
    } catch {
      setSignupError('Network error. Please try again.')
    } finally {
      setSignupLoading(false)
    }
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault()
    setSigninError('')
    setSigninLoading(true)
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signinEmail, password: signinPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setSigninError(data.error || 'Unable to sign in. Please check your details.')
        return
      }

      window.location.href = '/account'
    } catch {
      setSigninError('Network error. Please try again.')
    } finally {
      setSigninLoading(false)
    }
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault()
    setForgotError('')
    setForgotLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data = await res.json()

      if (!res.ok) {
        setForgotError(data.error || 'Unable to send reset link. Please try again.')
        return
      }

      setView('forgot_sent')
    } catch {
      setForgotError('Network error. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  const title =
    view === 'signup' ? 'Create your GuardScope account' :
    view === 'forgot' ? 'Reset your password' :
    view === 'forgot_sent' ? 'Check your inbox' :
    view === 'signup_success' ? 'Account created' :
    'Sign in to GuardScope'

  const description =
    view === 'signup' ? 'Start with five complete lifetime trial scans. No payment card is required.' :
    view === 'forgot' ? 'Enter your account email and we will send password reset instructions.' :
    view === 'forgot_sent' ? 'If an account exists for that email, a reset link is on the way.' :
    view === 'signup_success' && signupNeedsConfirmation ? 'Check your inbox and confirm your email before signing in.' :
    view === 'signup_success' ? 'Your account is ready. Sign in to continue.' :
    'Access your trial usage, subscription status, and GuardScope account settings.'

  return (
    <main style={{ minHeight: '100vh', background: C.bg, padding: '28px 24px 54px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 44 }}>
          <a href="/" aria-label="GuardScope home"><GuardScopeLogo variant="color" size={34} textSize={18} /></a>
          <a href={CTA_HREF} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${C.border}`, background: '#fff', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 760, color: C.text }}>
            {CTA_LABEL}<ArrowIcon />
          </a>
        </nav>

        <div className="auth-shell-grid">
          <section style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: '#f4f7f8', padding: '34px', minHeight: 520 }}>
            <p style={{ fontSize: 12, fontWeight: 820, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cyan, marginBottom: 14 }}>GuardScope account</p>
            <h1 style={{ fontSize: 'clamp(32px,5vw,58px)', lineHeight: 1.04, letterSpacing: '-0.02em', color: C.text, marginBottom: 16 }}>
              Gmail threat analysis with privacy-first account controls.
            </h1>
            <p style={{ fontSize: 16, color: C.body, lineHeight: 1.75, maxWidth: 540 }}>
              Sign in to keep trial usage and subscription access synchronized with the Chrome extension.
            </p>

            <div style={{ display: 'grid', gap: 12, marginTop: 30 }}>
              {[
                ['No email storage', 'Email content is analyzed only when you initiate a scan.'],
                ['Five complete scans', 'Evaluate the full threat report on five real emails.'],
                ['Account synchronized', 'Trial and subscription access follow you between the website and extension.'],
              ].map(([heading, copy]) => (
                <div key={heading} style={{ display: 'flex', gap: 12, padding: '14px 0', borderTop: `1px solid ${C.border}` }}>
                  <span style={{ color: C.success, marginTop: 2 }}><CheckIcon /></span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{heading}</div>
                    <div style={{ fontSize: 13, color: C.body, lineHeight: 1.65 }}>{copy}</div>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: C.muted, marginTop: 28 }}>
              By using GuardScope, you agree to the <a href="/terms" style={{ color: C.cyan, fontWeight: 700 }}>Terms</a> and acknowledge the <a href="/privacy" style={{ color: C.cyan, fontWeight: 700 }}>Privacy Policy</a>.
            </p>
          </section>

          <section style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: C.panel, padding: '32px', boxShadow: '0 24px 70px rgba(0,30,47,0.08)' }}>
            {(view === 'signin' || view === 'signup') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 4, border: `1px solid ${C.border}`, borderRadius: 8, background: '#f1f7fd', marginBottom: 26 }}>
                <button type="button" onClick={() => setView('signin')} style={{ borderRadius: 7, padding: '10px 12px', background: view === 'signin' ? '#fff' : 'transparent', color: C.text, fontWeight: 760, boxShadow: view === 'signin' ? '0 8px 20px rgba(0,30,47,0.08)' : 'none' }}>Sign in</button>
                <button type="button" onClick={() => setView('signup')} style={{ borderRadius: 7, padding: '10px 12px', background: view === 'signup' ? '#fff' : 'transparent', color: C.text, fontWeight: 760, boxShadow: view === 'signup' ? '0 8px 20px rgba(0,30,47,0.08)' : 'none' }}>Create account</button>
              </div>
            )}

            <h2 style={{ fontSize: 28, lineHeight: 1.15, color: C.text, marginBottom: 8 }}>{title}</h2>
            <p style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 24 }}>{description}</p>

            {view === 'signin' && (
              <form onSubmit={handleSignIn} className="auth-form-grid">
                {signinError && <Alert tone="error">{signinError}</Alert>}
                <label style={labelStyle}>Email<input style={fieldStyle} type="email" value={signinEmail} onChange={(e) => setSigninEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" /></label>
                <label style={labelStyle}>Password<input style={fieldStyle} type="password" value={signinPassword} onChange={(e) => setSigninPassword(e.target.value)} required autoComplete="current-password" placeholder="Your password" /></label>
                <button type="submit" disabled={signinLoading} style={{ height: 50, borderRadius: 8, background: C.text, color: '#fff', fontWeight: 820, fontSize: 14, opacity: signinLoading ? 0.72 : 1 }}>
                  {signinLoading ? 'Signing in...' : 'Sign in'}
                </button>
                <button type="button" onClick={() => setView('forgot')} style={{ justifySelf: 'center', color: C.cyan, fontSize: 13, fontWeight: 740 }}>Forgot password?</button>
              </form>
            )}

            {view === 'signup' && (
              <form onSubmit={handleSignUp} className="auth-form-grid">
                {signupError && <Alert tone="error">{signupError}</Alert>}
                <label style={labelStyle}>Email<input style={fieldStyle} type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" /></label>
                <label style={labelStyle}>Password<input style={fieldStyle} type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required minLength={12} autoComplete="new-password" placeholder="At least 12 characters" /></label>
                <Alert tone="info">Use a unique password with at least 12 characters. GuardScope accounts securely synchronize trial and billing status.</Alert>
                <button type="submit" disabled={signupLoading} style={{ height: 50, borderRadius: 8, background: C.text, color: '#fff', fontWeight: 820, fontSize: 14, opacity: signupLoading ? 0.72 : 1 }}>
                  {signupLoading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            )}

            {view === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="auth-form-grid">
                {forgotError && <Alert tone="error">{forgotError}</Alert>}
                <label style={labelStyle}>Email<input style={fieldStyle} type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" /></label>
                <button type="submit" disabled={forgotLoading} style={{ height: 50, borderRadius: 8, background: C.text, color: '#fff', fontWeight: 820, fontSize: 14, opacity: forgotLoading ? 0.72 : 1 }}>
                  {forgotLoading ? 'Sending reset link...' : 'Send reset link'}
                </button>
                <button type="button" onClick={() => setView('signin')} style={{ justifySelf: 'center', color: C.cyan, fontSize: 13, fontWeight: 740 }}>Back to sign in</button>
              </form>
            )}

            {view === 'forgot_sent' && (
              <div style={{ display: 'grid', gap: 16 }}>
                <Alert tone="success">If an account exists for {forgotEmail || 'that email'}, a password reset link has been sent.</Alert>
                <button type="button" onClick={() => setView('signin')} style={{ height: 50, borderRadius: 8, background: C.text, color: '#fff', fontWeight: 820, fontSize: 14 }}>Back to sign in</button>
              </div>
            )}

            {view === 'signup_success' && (
              <div style={{ display: 'grid', gap: 16 }}>
                <Alert tone="success">
                  {signupNeedsConfirmation
                    ? 'Your account was created. Confirm your email from your inbox, then sign in to start your trial.'
                    : 'Your account was created. Sign in to start your trial.'}
                </Alert>
                <button type="button" onClick={() => setView('signin')} style={{ height: 50, borderRadius: 8, background: C.text, color: '#fff', fontWeight: 820, fontSize: 14 }}>Go to sign in</button>
              </div>
            )}

            <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <a href="/pricing" style={{ color: C.cyan, fontSize: 13, fontWeight: 760 }}>View plans</a>
              <a href="/privacy" style={{ color: C.muted, fontSize: 13, fontWeight: 650 }}>Privacy details</a>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

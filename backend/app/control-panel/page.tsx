'use client'

import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { GuardScopeLogo } from '../components/GuardScopeLogo'

type Check = {
  label: string
  status: 'ok' | 'watch' | 'missing'
  detail: string
}

type PromoActivity = {
  code: string
  status: string
  requesterName: string | null
  requesterEmail: string | null
  requesterCountry: string | null
  claimedAt: string | null
  proExpiresAt: string | null
}

type HighRiskScan = {
  fromDomain: string
  riskLevel: string
  riskScore: number
  analysisPath: string
  durationMs: number | null
  analyzedAt: string
}

type ControlPanelData = {
  generatedAt: string
  owner: { username: string }
  listingUrl: string
  websiteUrl: string
  supportEmail: string
  checks: Check[]
  marketplace: {
    installs: number | null
    uninstalls: number | null
    status: string
    source: string
    note: string
  }
  bugReports: {
    open: number | null
    status: string
    source: string
    note: string
  }
  ownerOperations: {
    promoSummary: {
      total: number
      available: number
      assigned: number
      claimed: number
      expired: number
      warning?: string
      recent: PromoActivity[]
    }
    userSummary: {
      total: number
      free: number
      pro: number
      team: number
      currentMonthAnalyses: number
      warning?: string
    }
    analysisSummary: {
      total: number
      last24h: number
      highRisk30d: number
      averageRecentScore: number | null
      averageRecentDurationMs: number | null
      warning?: string
    }
    recentHighRisk: HighRiskScan[]
  }
}

const TOKEN_KEY = 'guardscope_control_panel_token'
type EntryMode = 'loading' | 'setup' | 'login' | 'recover' | 'reset'

const C = {
  bg: '#f4f7fb',
  panel: '#ffffff',
  text: '#061b2b',
  body: '#526477',
  muted: '#7b8998',
  border: '#d6e1ea',
  cyan: '#0b95c9',
  green: '#168a45',
  amber: '#b86b00',
  red: '#c73535',
  ink: '#061b2b',
}

function fmt(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Not connected'
  return new Intl.NumberFormat().format(value)
}

function dateLabel(value: string | null) {
  if (!value) return 'Not claimed'
  return new Date(value).toLocaleString()
}

function statusColor(status: Check['status'] | string) {
  if (status === 'ok') return C.green
  if (status === 'missing') return C.red
  return C.amber
}

function Metric({ label, value, detail, tone = C.cyan }: { label: string; value: string | number; detail: string; tone?: string }) {
  return (
    <article style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, minHeight: 132 }}>
      <div style={{ color: C.muted, fontSize: 11, fontWeight: 820, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: C.text, fontSize: 32, fontWeight: 900, lineHeight: 1.05, marginTop: 14 }}>{value}</div>
      <div style={{ color: tone, fontSize: 13, fontWeight: 760, marginTop: 10 }}>{detail}</div>
    </article>
  )
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <h2 style={{ color: C.text, fontSize: 18, lineHeight: 1.2 }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function SourceNotice({ title, note }: { title: string; note: string }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.amber}`, borderRadius: 8, padding: 13, background: '#fffaf0' }}>
      <div style={{ color: C.text, fontSize: 13, fontWeight: 820, marginBottom: 4 }}>{title}</div>
      <p style={{ color: C.body, fontSize: 13, lineHeight: 1.55 }}>{note}</p>
    </div>
  )
}

function GmailMark() {
  return (
    <svg viewBox="0 0 120 88" aria-hidden="true" style={{ width: '100%', height: '100%' }}>
      <path d="M13 14h94v60H13z" fill="#fff" opacity="0.88" />
      <path d="M13 14l47 35 47-35" fill="none" stroke="#EA4335" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 16v58" stroke="#34A853" strokeWidth="13" strokeLinecap="round" />
      <path d="M107 16v58" stroke="#4285F4" strokeWidth="13" strokeLinecap="round" />
      <path d="M13 74h94" stroke="#FBBC04" strokeWidth="13" strokeLinecap="round" />
    </svg>
  )
}

function EnvelopeMark() {
  return (
    <svg viewBox="0 0 120 92" aria-hidden="true" style={{ width: '100%', height: '100%' }}>
      <rect x="12" y="18" width="96" height="58" rx="10" fill="none" stroke="currentColor" strokeWidth="9" />
      <path d="M18 26l42 33 42-33M18 72l29-26M102 72L73 46" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BugMark() {
  return (
    <svg viewBox="0 0 110 110" aria-hidden="true" style={{ width: '100%', height: '100%' }}>
      <path d="M37 35c0-10 8-18 18-18s18 8 18 18v7H37v-7Z" fill="none" stroke="currentColor" strokeWidth="8" />
      <rect x="28" y="40" width="54" height="52" rx="23" fill="none" stroke="currentColor" strokeWidth="8" />
      <path d="M20 50H8M20 72H8M90 50h12M90 72h12M36 27 25 15M74 27l11-12M55 43v46" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    </svg>
  )
}

function GuardMark() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
      <GuardScopeLogo variant="dark" size={90} textSize={0} />
    </div>
  )
}

const watermarkItems = [
  { kind: 'gmail', size: 154, x: 7, y: 12, vx: 0.26, vy: 0.18, rotate: -10 },
  { kind: 'bug', size: 116, x: 24, y: 68, vx: 0.2, vy: -0.22, rotate: 12 },
  { kind: 'guard', size: 142, x: 70, y: 16, vx: -0.24, vy: 0.19, rotate: 8 },
  { kind: 'envelope', size: 132, x: 79, y: 72, vx: -0.18, vy: -0.2, rotate: -14 },
  { kind: 'gmail', size: 112, x: 47, y: 8, vx: 0.16, vy: 0.24, rotate: 16 },
  { kind: 'bug', size: 94, x: 8, y: 78, vx: 0.28, vy: -0.16, rotate: -18 },
  { kind: 'guard', size: 100, x: 88, y: 38, vx: -0.25, vy: 0.12, rotate: 20 },
  { kind: 'envelope', size: 156, x: 34, y: 34, vx: 0.18, vy: -0.17, rotate: 5 },
]

function FloatingWatermarks() {
  const fieldRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    const field = fieldRef.current
    if (!field) return

    const movers = watermarkItems.map((item) => ({
      ...item,
      x: 0,
      y: 0,
      vx: item.vx,
      vy: item.vy,
      initialized: false,
    }))

    let raf = 0
    let last = performance.now()

    function tick(now: number) {
      if (!field) return
      const rect = field.getBoundingClientRect()
      const dt = Math.min(32, now - last)
      last = now

      movers.forEach((item) => {
        if (!item.initialized) {
          item.x = (rect.width - item.size) * (item.x / 100)
          item.y = (rect.height - item.size) * (item.y / 100)
          item.initialized = true
        }

        item.x += item.vx * dt
        item.y += item.vy * dt

        if (item.x < -item.size * 0.18 || item.x > rect.width - item.size * 0.82) {
          item.vx *= -1
          item.x = Math.max(-item.size * 0.18, Math.min(rect.width - item.size * 0.82, item.x))
        }

        if (item.y < -item.size * 0.18 || item.y > rect.height - item.size * 0.82) {
          item.vy *= -1
          item.y = Math.max(-item.size * 0.18, Math.min(rect.height - item.size * 0.82, item.y))
        }
      })

      for (let i = 0; i < movers.length; i += 1) {
        for (let j = i + 1; j < movers.length; j += 1) {
          const a = movers[i]
          const b = movers[j]
          const ax = a.x + a.size / 2
          const ay = a.y + a.size / 2
          const bx = b.x + b.size / 2
          const by = b.y + b.size / 2
          const dx = ax - bx
          const dy = ay - by
          const distance = Math.hypot(dx, dy) || 1
          const minDistance = (a.size + b.size) * 0.36

          if (distance < minDistance) {
            const push = (minDistance - distance) / minDistance
            const nx = dx / distance
            const ny = dy / distance
            a.vx += nx * push * 0.035
            a.vy += ny * push * 0.035
            b.vx -= nx * push * 0.035
            b.vy -= ny * push * 0.035
          }
        }
      }

      movers.forEach((item, index) => {
        const speed = Math.hypot(item.vx, item.vy)
        if (speed > 0.36) {
          item.vx = (item.vx / speed) * 0.36
          item.vy = (item.vy / speed) * 0.36
        }
        if (speed < 0.11) {
          item.vx *= 1.05
          item.vy *= 1.05
        }

        const node = itemRefs.current[index]
        if (node) {
          node.style.transform = `translate3d(${item.x}px, ${item.y}px, 0) rotate(${item.rotate + Math.sin(now / 4200 + index) * 8}deg)`
        }
      })

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  function renderMark(kind: string) {
    if (kind === 'gmail') return <GmailMark />
    if (kind === 'bug') return <BugMark />
    if (kind === 'guard') return <GuardMark />
    return <EnvelopeMark />
  }

  return (
    <div ref={fieldRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      {watermarkItems.map((item, index) => (
        <div
          key={`${item.kind}-${index}`}
          ref={(node) => { itemRefs.current[index] = node }}
          style={{
            position: 'absolute',
            width: item.size,
            height: item.size,
            color: item.kind === 'bug' ? '#c73535' : item.kind === 'envelope' ? '#0b95c9' : '#061b2b',
            opacity: 0.075,
            filter: 'drop-shadow(0 18px 22px rgba(6,27,43,0.2))',
            willChange: 'transform',
            transform: `translate3d(${item.x}vw, ${item.y}vh, 0) rotate(${item.rotate}deg)`,
          }}
        >
          {renderMark(item.kind)}
        </div>
      ))}
    </div>
  )
}

export default function ControlPanelPage() {
  const [mode, setMode] = useState<EntryMode>('loading')
  const [username, setUsername] = useState('')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [token, setToken] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [data, setData] = useState<ControlPanelData | null>(null)
  const [loading, setLoading] = useState(false)
  const [changeLoading, setChangeLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reset = params.get('reset')
    if (reset) {
      setResetToken(reset)
      setMode('reset')
      return
    }

    const saved = window.sessionStorage.getItem(TOKEN_KEY)
    if (saved) {
      setToken(saved)
      return
    }

    void loadSetupStatus()
  }, [])

  useEffect(() => {
    if (token) void loadPanel(token)
  }, [token])

  async function loadSetupStatus() {
    setError('')
    try {
      const res = await fetch('/api/control-panel/setup', { cache: 'no-store' })
      const body = await res.json()
      if (!res.ok) {
        setMode('setup')
        setError(body.error || 'Unable to read Control Panel setup status.')
        return
      }
      setMode(body.configured ? 'login' : 'setup')
    } catch {
      setMode('setup')
      setError('Unable to read Control Panel setup status.')
    }
  }

  async function handleSetup(event: FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setChangeLoading(true)
    try {
      const res = await fetch('/api/control-panel/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: newPassword, recoveryEmail }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || 'Unable to create Control Panel owner.')
        return
      }
      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMode('login')
      setNotice('Owner created. Sign in with the username and password you just created.')
    } catch {
      setError('Unable to create Control Panel owner.')
    } finally {
      setChangeLoading(false)
    }
  }

  async function handleSignIn(event: FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      const res = await fetch('/api/control-panel/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const body = await res.json()
      if (!res.ok) {
        if (body.setupRequired) setMode('setup')
        setError(body.error || 'Unable to open Control Panel.')
        return
      }
      window.sessionStorage.setItem(TOKEN_KEY, body.accessToken)
      setToken(body.accessToken)
      setPassword('')
    } catch {
      setError('Unable to reach Control Panel auth.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordChange(event: FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.')
      return
    }

    setChangeLoading(true)
    try {
      const res = await fetch('/api/control-panel/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || 'Unable to save new owner password.')
        return
      }

      window.sessionStorage.removeItem(TOKEN_KEY)
      setToken('')
      setData(null)
      setResetToken('')
      setNewPassword('')
      setConfirmPassword('')
      window.history.replaceState(null, '', '/control-panel')
      setMode('login')
      setNotice('Password changed. Please log in with the new password.')
    } catch {
      setError('Unable to save new owner password.')
    } finally {
      setChangeLoading(false)
    }
  }

  async function handleRecover(event: FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      const res = await fetch('/api/control-panel/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, recoveryEmail }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || 'Unable to send recovery email.')
        return
      }
      setMode('login')
      setNotice('If the details match the owner account, a recovery link has been sent.')
    } catch {
      setError('Unable to send recovery email.')
    } finally {
      setLoading(false)
    }
  }

  async function loadPanel(accessToken = token) {
    if (!accessToken) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/control-panel/status', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      })
      const body = await res.json()
      if (!res.ok) {
        window.sessionStorage.removeItem(TOKEN_KEY)
        setToken('')
        setData(null)
        setError(body.error || 'Owner sign-in required.')
        return
      }
      setData(body)
    } catch {
      setError('Unable to load Control Panel metrics.')
    } finally {
      setLoading(false)
    }
  }

  function signOut() {
    window.sessionStorage.removeItem(TOKEN_KEY)
    setToken('')
    setData(null)
    setMode('login')
  }

  const ops = data?.ownerOperations
  const healthTone = useMemo(() => {
    if (!data) return C.muted
    return data.checks.some((check) => check.status === 'missing') ? C.red : data.checks.some((check) => check.status === 'watch') ? C.amber : C.green
  }, [data])

  if (!data || !ops) {
    return (
      <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#f7fbff 0%,#eef6fb 100%)', padding: 20, position: 'relative', overflow: 'hidden' }}>
        <FloatingWatermarks />

        <section style={{ minHeight: 'calc(100vh - 40px)', display: 'grid', placeItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 'min(390px, 100%)', display: 'grid', gap: 22, justifyItems: 'center' }}>
            <a href="/" aria-label="GuardScope home" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              <GuardScopeLogo variant="dark" size={48} textSize={24} />
            </a>

            <form
              onSubmit={mode === 'setup' ? handleSetup : mode === 'recover' ? handleRecover : mode === 'reset' ? handlePasswordChange : handleSignIn}
              style={{ width: '100%', display: 'grid', gap: 12, background: 'rgba(255,255,255,0.84)', border: `1px solid rgba(214,225,234,0.88)`, borderRadius: 8, padding: 22, boxShadow: '0 24px 70px rgba(6,27,43,0.12)', backdropFilter: 'blur(18px)' }}
            >
              {mode === 'loading' && <p style={{ color: C.body, fontSize: 13, textAlign: 'center' }}>Checking Control Panel...</p>}

              {(mode === 'setup' || mode === 'login' || mode === 'recover') && (
                <label style={{ display: 'grid', gap: 7, color: C.text, fontSize: 13, fontWeight: 760 }}>
                  Username
                  <input value={username} onChange={(event) => setUsername(event.target.value)} type="text" autoComplete="username" required style={{ height: 48, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 13px', font: 'inherit', color: C.text, background: '#fff', outline: 'none' }} />
                </label>
              )}

              {mode === 'setup' && (
                <label style={{ display: 'grid', gap: 7, color: C.text, fontSize: 13, fontWeight: 760 }}>
                  Recovery email
                  <input value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} type="email" autoComplete="email" required style={{ height: 48, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 13px', font: 'inherit', color: C.text, background: '#fff', outline: 'none' }} />
                </label>
              )}

              {mode === 'recover' && (
                <label style={{ display: 'grid', gap: 7, color: C.text, fontSize: 13, fontWeight: 760 }}>
                  Recovery email
                  <input value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} type="email" autoComplete="email" required style={{ height: 48, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 13px', font: 'inherit', color: C.text, background: '#fff', outline: 'none' }} />
                </label>
              )}

              {mode === 'login' && (
                <label style={{ display: 'grid', gap: 7, color: C.text, fontSize: 13, fontWeight: 760 }}>
                  Password
                  <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required style={{ height: 48, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 13px', font: 'inherit', color: C.text, background: '#fff', outline: 'none' }} />
                </label>
              )}

              {(mode === 'setup' || mode === 'reset') && (
                <>
                  <label style={{ display: 'grid', gap: 7, color: C.text, fontSize: 13, fontWeight: 760 }}>
                    {mode === 'setup' ? 'Password' : 'New password'}
                    <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" autoComplete="new-password" required minLength={14} style={{ height: 48, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 13px', font: 'inherit', color: C.text, background: '#fff', outline: 'none' }} />
                  </label>
                  <label style={{ display: 'grid', gap: 7, color: C.text, fontSize: 13, fontWeight: 760 }}>
                    Confirm password
                    <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" required minLength={14} style={{ height: 48, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 13px', font: 'inherit', color: C.text, background: '#fff', outline: 'none' }} />
                  </label>
                </>
              )}

              {notice && (
                <div style={{ border: `1px solid rgba(22,138,69,0.24)`, background: '#f0fff6', color: '#126b37', borderRadius: 8, padding: 11, fontSize: 12, lineHeight: 1.5 }}>
                  {notice}
                </div>
              )}
              {error && (
                <div style={{ border: `1px solid rgba(199,53,53,0.24)`, background: '#fff3f3', color: '#8b2020', borderRadius: 8, padding: 11, fontSize: 12, lineHeight: 1.5 }}>
                  {error}
                </div>
              )}

              <button disabled={loading || changeLoading || mode === 'loading'} style={{ height: 48, border: 0, borderRadius: 8, background: C.ink, color: '#fff', fontSize: 14, fontWeight: 840, opacity: loading || changeLoading || mode === 'loading' ? 0.72 : 1, cursor: loading || changeLoading ? 'wait' : 'pointer' }}>
                {mode === 'setup' ? (changeLoading ? 'Creating...' : 'Create owner') :
                 mode === 'recover' ? (loading ? 'Sending...' : 'Send recovery email') :
                 mode === 'reset' ? (changeLoading ? 'Saving...' : 'Change password') :
                 loading ? 'Opening...' : 'Open Control Panel'}
              </button>

              {mode === 'login' && (
                <button type="button" onClick={() => { setError(''); setNotice(''); setMode('recover') }} style={{ justifySelf: 'center', color: C.cyan, fontSize: 13, fontWeight: 760, background: 'transparent', border: 0, cursor: 'pointer' }}>
                  Forgot password?
                </button>
              )}

              {mode === 'recover' && (
                <button type="button" onClick={() => { setError(''); setNotice(''); setMode('login') }} style={{ justifySelf: 'center', color: C.muted, fontSize: 13, fontWeight: 760, background: 'transparent', border: 0, cursor: 'pointer' }}>
                  Back to login
                </button>
              )}
            </form>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, padding: '24px 20px 54px' }}>
      <div style={{ width: 'min(1240px, 100%)', margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}>
          <a href="/" aria-label="GuardScope home"><GuardScopeLogo variant="dark" size={32} textSize={17} /></a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'end' }}>
            {data && <span style={{ color: C.body, fontSize: 13 }}>{data.owner.username}</span>}
            {data && <button onClick={() => void loadPanel()} style={{ border: `1px solid ${C.border}`, background: '#fff', borderRadius: 8, color: C.text, padding: '9px 12px', fontSize: 13, fontWeight: 780 }}>Refresh</button>}
            {token && <button onClick={signOut} style={{ border: `1px solid ${C.border}`, background: '#fff', borderRadius: 8, color: C.body, padding: '9px 12px', fontSize: 13, fontWeight: 760 }}>Sign out</button>}
          </div>
        </header>

        <section style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <p style={{ color: C.cyan, fontSize: 12, fontWeight: 840, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Control Panel</p>
            <h1 style={{ color: C.text, fontSize: 'clamp(34px,5vw,56px)', lineHeight: 1.02 }}>GuardScope operations</h1>
            <p style={{ color: C.body, fontSize: 15, lineHeight: 1.65, maxWidth: 680, marginTop: 10 }}>
              Monitor users, promo codes, scans, health, support signals, and marketplace readiness without changing the live Chrome extension.
            </p>
          </div>
          {data && (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: '#fff', padding: '12px 14px', minWidth: 210 }}>
              <div style={{ color: C.muted, fontSize: 11, fontWeight: 820, textTransform: 'uppercase' }}>Overall status</div>
              <div style={{ color: healthTone, fontSize: 22, fontWeight: 900, marginTop: 5 }}>{data.checks.some((c) => c.status !== 'ok') ? 'Watch' : 'Healthy'}</div>
            </div>
          )}
        </section>

        {error && (
          <div style={{ border: `1px solid rgba(199,53,53,0.28)`, background: '#fff2f2', color: '#8b2020', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
              <Metric label="Store installs" value={fmt(data.marketplace.installs)} detail={data.marketplace.source} tone={C.amber} />
              <Metric label="Uninstalls" value={fmt(data.marketplace.uninstalls)} detail="Awaiting CWS source" tone={C.amber} />
              <Metric label="Users" value={fmt(ops.userSummary.total)} detail={`${fmt(ops.userSummary.pro)} pro / ${fmt(ops.userSummary.free)} free`} tone={C.green} />
              <Metric label="Codes left" value={fmt(ops.promoSummary.available)} detail={`${fmt(ops.promoSummary.claimed)} claimed`} />
              <Metric label="Scans" value={fmt(ops.analysisSummary.total)} detail={`${fmt(ops.analysisSummary.last24h)} in 24h`} tone={C.green} />
              <Metric label="Bug reports" value={fmt(data.bugReports.open)} detail={data.bugReports.source} tone={C.amber} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 16 }}>
              <Panel title="App health">
                <div style={{ display: 'grid', gap: 9 }}>
                  {data.checks.map((check) => (
                    <div key={check.label} style={{ border: `1px solid ${C.border}`, borderLeft: `4px solid ${statusColor(check.status)}`, borderRadius: 8, padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <strong style={{ color: C.text, fontSize: 13 }}>{check.label}</strong>
                        <span style={{ color: statusColor(check.status), fontSize: 11, fontWeight: 860, textTransform: 'uppercase' }}>{check.status}</span>
                      </div>
                      <p style={{ color: C.body, fontSize: 12, lineHeight: 1.55, marginTop: 6 }}>{check.detail}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Marketplace monitoring">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <Metric label="Installs" value={fmt(data.marketplace.installs)} detail="Chrome Web Store" tone={C.amber} />
                  <Metric label="Uninstalls" value={fmt(data.marketplace.uninstalls)} detail="Chrome Web Store" tone={C.amber} />
                </div>
                <SourceNotice title="Install source not connected yet" note={data.marketplace.note} />
              </Panel>

              <Panel title="Bug reports">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <Metric label="Open bugs" value={fmt(data.bugReports.open)} detail="Support queue" tone={C.amber} />
                  <Metric label="Support" value="Active" detail={data.supportEmail} tone={C.green} />
                </div>
                <SourceNotice title="Bug source is support-driven" note={data.bugReports.note} />
              </Panel>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 16 }}>
              <Panel title="Promo codes">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 14 }}>
                  {[
                    ['Total', ops.promoSummary.total],
                    ['Left', ops.promoSummary.available],
                    ['Assigned', ops.promoSummary.assigned],
                    ['Used', ops.promoSummary.claimed],
                    ['Expired', ops.promoSummary.expired],
                  ].map(([label, value]) => (
                    <div key={label} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 9 }}>
                      <div style={{ color: C.muted, fontSize: 10, fontWeight: 820 }}>{label}</div>
                      <div style={{ color: C.text, fontSize: 20, fontWeight: 900 }}>{fmt(value as number)}</div>
                    </div>
                  ))}
                </div>
                {ops.promoSummary.recent.length ? ops.promoSummary.recent.slice(0, 5).map((item) => (
                  <div key={`${item.code}-${item.requesterEmail}`} style={{ borderTop: `1px solid ${C.border}`, padding: '10px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <strong style={{ color: C.text, fontSize: 13 }}>{item.code}</strong>
                      <span style={{ color: item.status === 'claimed' ? C.green : C.amber, fontSize: 11, fontWeight: 820 }}>{item.status}</span>
                    </div>
                    <div style={{ color: C.body, fontSize: 12, marginTop: 5 }}>{item.requesterEmail || 'No email'} - {dateLabel(item.claimedAt)}</div>
                  </div>
                )) : <p style={{ color: C.body, fontSize: 13 }}>No promo-code activity yet.</p>}
              </Panel>

              <Panel title="Scan analytics">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  <Metric label="24h scans" value={fmt(ops.analysisSummary.last24h)} detail="Recent activity" tone={C.green} />
                  <Metric label="High risk" value={fmt(ops.analysisSummary.highRisk30d)} detail="Last 30 days" tone={C.red} />
                  <Metric label="Avg score" value={fmt(ops.analysisSummary.averageRecentScore)} detail="Recent sample" tone={C.amber} />
                  <Metric label="Latency" value={ops.analysisSummary.averageRecentDurationMs ? `${fmt(ops.analysisSummary.averageRecentDurationMs)}ms` : 'n/a'} detail="Recent avg" tone={C.amber} />
                </div>
              </Panel>
            </div>

            <Panel title="Recent high-risk scans">
              {ops.recentHighRisk.length ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                    <thead>
                      <tr>
                        {['Time', 'Domain', 'Risk', 'Score', 'Path', 'Duration'].map((heading) => (
                          <th key={heading} style={{ textAlign: 'left', color: C.muted, fontSize: 11, textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, padding: '9px 8px' }}>{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ops.recentHighRisk.map((row) => (
                        <tr key={`${row.analyzedAt}-${row.fromDomain}-${row.riskScore}`}>
                          <td style={{ color: C.body, fontSize: 12, borderBottom: `1px solid ${C.border}`, padding: '10px 8px' }}>{new Date(row.analyzedAt).toLocaleString()}</td>
                          <td style={{ color: C.text, fontSize: 12, fontWeight: 760, borderBottom: `1px solid ${C.border}`, padding: '10px 8px' }}>{row.fromDomain}</td>
                          <td style={{ color: row.riskLevel === 'CRITICAL' ? C.red : C.amber, fontSize: 12, fontWeight: 860, borderBottom: `1px solid ${C.border}`, padding: '10px 8px' }}>{row.riskLevel}</td>
                          <td style={{ color: C.text, fontSize: 12, borderBottom: `1px solid ${C.border}`, padding: '10px 8px' }}>{row.riskScore}</td>
                          <td style={{ color: C.body, fontSize: 12, borderBottom: `1px solid ${C.border}`, padding: '10px 8px' }}>{row.analysisPath}</td>
                          <td style={{ color: C.body, fontSize: 12, borderBottom: `1px solid ${C.border}`, padding: '10px 8px' }}>{row.durationMs ? `${fmt(row.durationMs)}ms` : 'n/a'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p style={{ color: C.body, fontSize: 13 }}>No high-risk scan metadata yet.</p>}
            </Panel>

            <p style={{ color: C.muted, fontSize: 12 }}>
              Last updated: {new Date(data.generatedAt).toLocaleString()} - Control Panel reads operational metadata only. The published extension was not changed.
            </p>
        </div>
      </div>
    </main>
  )
}

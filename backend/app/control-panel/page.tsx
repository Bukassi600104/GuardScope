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
  createdAt: string | null
  claimDeadline: string | null
  claimedAt: string | null
  proExpiresAt: string | null
}

type UserActivity = {
  id: string
  email: string
  tier: string
  proExpiresAt: string | null
  createdAt: string
  currentMonthAnalyses: number
}

type ScanActivity = {
  fromDomain: string
  riskLevel: string
  riskScore: number
  analysisPath: string
  durationMs: number | null
  analyzedAt: string
}

type OperationalIssue = {
  id: string
  severity: string
  source: string
  eventType: string
  message: string
  status: string
  createdAt: string
}

type TrendPoint = {
  date: string
  scans: number
}

type RiskBucket = {
  label: string
  count: number
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
      utilizationRate: number
      warning?: string
      recent: PromoActivity[]
    }
    userSummary: {
      total: number
      free: number
      pro: number
      team: number
      currentMonthAnalyses: number
      recent: UserActivity[]
      warning?: string
    }
    analysisSummary: {
      total: number
      last24h: number
      highRisk30d: number
      averageRecentScore: number | null
      averageRecentDurationMs: number | null
      trend14d: TrendPoint[]
      riskDistribution: RiskBucket[]
      recentHighRisk: ScanActivity[]
      recentScans: ScanActivity[]
      warning?: string
    }
    issueSummary: {
      open: number
      critical: number
      last24h: number
      recent: OperationalIssue[]
      warning?: string
    }
  }
}

type EntryMode = 'loading' | 'setup' | 'login' | 'recover' | 'reset'
type View = 'overview' | 'codes' | 'users' | 'scans' | 'issues'

const TOKEN_KEY = 'guardscope_control_panel_token'

const palette = {
  bg: '#eef4f8',
  ink: '#061724',
  text: '#0a2233',
  body: '#52697c',
  muted: '#7d8c99',
  line: '#d8e4ec',
  panel: '#ffffff',
  panelSoft: '#f8fbfd',
  cyan: '#0796c9',
  cyanSoft: '#e7f7fc',
  green: '#158a4b',
  greenSoft: '#e9f8ef',
  amber: '#b56a00',
  amberSoft: '#fff4dd',
  red: '#c63838',
  redSoft: '#fff0f0',
}

function fmt(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Not connected'
  return new Intl.NumberFormat().format(value)
}

function dateLabel(value: string | null | undefined) {
  if (!value) return 'Not set'
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function shortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function riskTone(value: string) {
  const risk = value.toUpperCase()
  if (risk === 'CRITICAL' || risk === 'HIGH' || value === 'critical' || value === 'error') return palette.red
  if (risk === 'MEDIUM' || value === 'warning' || value === 'watch' || value === 'investigating') return palette.amber
  if (risk === 'SAFE' || value === 'ok' || value === 'resolved') return palette.green
  return palette.cyan
}

function statusLabel(status: string) {
  if (status === 'missing') return 'Needs attention'
  if (status === 'watch') return 'Watch'
  return status.replace(/_/g, ' ')
}

function healthState(checks: Check[], issues: ControlPanelData['ownerOperations']['issueSummary']) {
  if (issues.critical > 0 || checks.some((check) => check.status === 'missing')) return 'Critical'
  if (issues.open > 0 || checks.some((check) => check.status === 'watch')) return 'Watch'
  return 'Healthy'
}

function StatusPill({ value }: { value: string }) {
  const tone = riskTone(value)
  return (
    <span className="pill" style={{ color: tone, background: `${tone}15`, borderColor: `${tone}35` }}>
      {statusLabel(value)}
    </span>
  )
}

function AppIcon({ name }: { name: 'activity' | 'codes' | 'users' | 'scan' | 'issues' | 'store' | 'health' }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.1, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      {name === 'activity' && <path {...common} d="M4 13h4l3-8 4 14 2-6h3" />}
      {name === 'codes' && <path {...common} d="M7 7h10v10H7zM4 4h5M15 4h5M4 20h5M15 20h5" />}
      {name === 'users' && <path {...common} d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM18 11.5c1.8.5 3 2 3 3.8M17 4.4a3 3 0 0 1 0 5.2" />}
      {name === 'scan' && <path {...common} d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8M12 8v8" />}
      {name === 'issues' && <path {...common} d="M12 3 2.8 19h18.4L12 3ZM12 9v4M12 17h.01" />}
      {name === 'store' && <path {...common} d="M4 10h16l-1.5 10h-13L4 10ZM8 10V7a4 4 0 0 1 8 0v3" />}
      {name === 'health' && <path {...common} d="M20 6 9 17l-5-5" />}
    </svg>
  )
}

function MetricCard({ icon, label, value, detail, tone = palette.cyan }: {
  icon: Parameters<typeof AppIcon>[0]['name']
  label: string
  value: string | number
  detail: string
  tone?: string
}) {
  return (
    <article className="metric">
      <div className="metricTop">
        <span className="metricIcon" style={{ color: tone, background: `${tone}13` }}><AppIcon name={icon} /></span>
        <span className="metricLabel">{label}</span>
      </div>
      <div className="metricValue">{value}</div>
      <div className="metricDetail" style={{ color: tone }}>{detail}</div>
    </article>
  )
}

function Panel({ title, caption, action, children }: { title: string; caption?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2>{title}</h2>
          {caption && <p>{caption}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function ProgressBar({ value, color = palette.cyan }: { value: number; color?: string }) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <div className="progressTrack">
      <div className="progressFill" style={{ width: `${width}%`, background: color }} />
    </div>
  )
}

function Sparkline({ data }: { data: TrendPoint[] }) {
  const width = 520
  const height = 170
  const max = Math.max(1, ...data.map((point) => point.scans))
  const points = data.map((point, index) => {
    const x = data.length === 1 ? 0 : (index / (data.length - 1)) * width
    const y = height - (point.scans / max) * (height - 24) - 12
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="chartWrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="14 day scan activity trend">
        <defs>
          <linearGradient id="scanFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0796c9" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0796c9" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M0,${height} L${points.replaceAll(' ', ' L')} L${width},${height} Z`} fill="url(#scanFill)" />
        <polyline points={points} fill="none" stroke={palette.cyan} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((point, index) => {
          const x = data.length === 1 ? 0 : (index / (data.length - 1)) * width
          const y = height - (point.scans / max) * (height - 24) - 12
          return <circle key={point.date} cx={x} cy={y} r="4.5" fill="#fff" stroke={palette.cyan} strokeWidth="3" />
        })}
      </svg>
      <div className="chartTicks">
        <span>{data[0] ? shortDate(data[0].date) : 'Start'}</span>
        <span>{data[data.length - 1] ? shortDate(data[data.length - 1].date) : 'Today'}</span>
      </div>
    </div>
  )
}

function RiskBars({ buckets }: { buckets: RiskBucket[] }) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count))
  return (
    <div className="riskBars">
      {buckets.map((bucket) => {
        const color = riskTone(bucket.label)
        return (
          <div className="riskRow" key={bucket.label}>
            <span>{bucket.label}</span>
            <ProgressBar value={(bucket.count / max) * 100} color={color} />
            <strong>{fmt(bucket.count)}</strong>
          </div>
        )
      })}
    </div>
  )
}

function SourceNotice({ title, note }: { title: string; note: string }) {
  return (
    <div className="sourceNotice">
      <strong>{title}</strong>
      <p>{note}</p>
    </div>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="emptyState">{children}</div>
}

function GmailMark() {
  return (
    <svg viewBox="0 0 120 88" aria-hidden="true">
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
    <svg viewBox="0 0 120 92" aria-hidden="true">
      <rect x="12" y="18" width="96" height="58" rx="10" fill="none" stroke="currentColor" strokeWidth="9" />
      <path d="M18 26l42 33 42-33M18 72l29-26M102 72L73 46" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BugMark() {
  return (
    <svg viewBox="0 0 110 110" aria-hidden="true">
      <path d="M37 35c0-10 8-18 18-18s18 8 18 18v7H37v-7Z" fill="none" stroke="currentColor" strokeWidth="8" />
      <rect x="28" y="40" width="54" height="52" rx="23" fill="none" stroke="currentColor" strokeWidth="8" />
      <path d="M20 50H8M20 72H8M90 50h12M90 72h12M36 27 25 15M74 27l11-12M55 43v46" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    </svg>
  )
}

function GuardMark() {
  return (
    <div className="guardMark">
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
      startX: item.x,
      startY: item.y,
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
          item.x = (rect.width - item.size) * (item.startX / 100)
          item.y = (rect.height - item.size) * (item.startY / 100)
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
          const dx = (a.x + a.size / 2) - (b.x + b.size / 2)
          const dy = (a.y + a.size / 2) - (b.y + b.size / 2)
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
        const node = itemRefs.current[index]
        if (node) node.style.transform = `translate3d(${item.x}px, ${item.y}px, 0) rotate(${item.rotate + Math.sin(now / 4200 + index) * 8}deg)`
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
    <div ref={fieldRef} className="watermarkField" aria-hidden="true">
      {watermarkItems.map((item, index) => (
        <div
          key={`${item.kind}-${index}`}
          ref={(node) => { itemRefs.current[index] = node }}
          className="watermarkItem"
          style={{
            width: item.size,
            height: item.size,
            color: item.kind === 'bug' ? palette.red : item.kind === 'envelope' ? palette.cyan : palette.ink,
            transform: `translate3d(${item.x}vw, ${item.y}vh, 0) rotate(${item.rotate}deg)`,
          }}
        >
          {renderMark(item.kind)}
        </div>
      ))}
    </div>
  )
}

function AuthShell({ mode, username, recoveryEmail, password, newPassword, confirmPassword, loading, changeLoading, notice, error, setUsername, setRecoveryEmail, setPassword, setNewPassword, setConfirmPassword, setMode, onSubmit }: {
  mode: EntryMode
  username: string
  recoveryEmail: string
  password: string
  newPassword: string
  confirmPassword: string
  loading: boolean
  changeLoading: boolean
  notice: string
  error: string
  setUsername: (value: string) => void
  setRecoveryEmail: (value: string) => void
  setPassword: (value: string) => void
  setNewPassword: (value: string) => void
  setConfirmPassword: (value: string) => void
  setMode: (value: EntryMode) => void
  onSubmit: (event: FormEvent) => void
}) {
  return (
    <main className="loginShell">
      <FloatingWatermarks />
      <section className="loginCenter">
        <div className="loginStack">
          <a href="/" aria-label="GuardScope home" className="loginLogo"><GuardScopeLogo variant="dark" size={48} textSize={24} /></a>

          <form onSubmit={onSubmit} className="loginCard">
            {mode === 'loading' && <p className="formHint">Checking Control Center...</p>}

            {(mode === 'setup' || mode === 'login' || mode === 'recover') && (
              <label className="field">
                Username
                <input value={username} onChange={(event) => setUsername(event.target.value)} type="text" autoComplete="username" required />
              </label>
            )}

            {(mode === 'setup' || mode === 'recover') && (
              <label className="field">
                Recovery email
                <input value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} type="email" autoComplete="email" required />
              </label>
            )}

            {mode === 'login' && (
              <label className="field">
                Password
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required />
              </label>
            )}

            {(mode === 'setup' || mode === 'reset') && (
              <>
                <label className="field">
                  {mode === 'setup' ? 'Password' : 'New password'}
                  <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" autoComplete="new-password" required minLength={14} />
                </label>
                <label className="field">
                  Confirm password
                  <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" required minLength={14} />
                </label>
              </>
            )}

            {notice && <div className="notice success">{notice}</div>}
            {error && <div className="notice danger">{error}</div>}

            <button disabled={loading || changeLoading || mode === 'loading'} className="primaryButton">
              {mode === 'setup' ? (changeLoading ? 'Creating...' : 'Create owner') :
               mode === 'recover' ? (loading ? 'Sending...' : 'Send recovery email') :
               mode === 'reset' ? (changeLoading ? 'Saving...' : 'Change password') :
               loading ? 'Opening...' : 'Open Control Center'}
            </button>

            {mode === 'login' && (
              <button type="button" onClick={() => setMode('recover')} className="linkButton">Forgot password?</button>
            )}

            {mode === 'recover' && (
              <button type="button" onClick={() => setMode('login')} className="linkButton muted">Back to login</button>
            )}
          </form>
        </div>
      </section>
    </main>
  )
}

export default function ControlPanelPage() {
  const [mode, setMode] = useState<EntryMode>('loading')
  const [view, setView] = useState<View>('overview')
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
        setError(body.error || 'Unable to read Control Center setup status.')
        return
      }
      setMode(body.configured ? 'login' : 'setup')
    } catch {
      setMode('setup')
      setError('Unable to read Control Center setup status.')
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
        setError(body.error || 'Unable to create Control Center owner.')
        return
      }
      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMode('login')
      setNotice('Owner created. Sign in with the username and password you just created.')
    } catch {
      setError('Unable to create Control Center owner.')
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
        setError(body.error || 'Unable to open Control Center.')
        return
      }
      window.sessionStorage.setItem(TOKEN_KEY, body.accessToken)
      setToken(body.accessToken)
      setPassword('')
    } catch {
      setError('Unable to reach Control Center auth.')
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
      setError('Unable to load Control Center metrics.')
    } finally {
      setLoading(false)
    }
  }

  function authSubmit(event: FormEvent) {
    if (mode === 'setup') return void handleSetup(event)
    if (mode === 'recover') return void handleRecover(event)
    if (mode === 'reset') return void handlePasswordChange(event)
    return void handleSignIn(event)
  }

  function signOut() {
    window.sessionStorage.removeItem(TOKEN_KEY)
    setToken('')
    setData(null)
    setMode('login')
  }

  const ops = data?.ownerOperations
  const state = useMemo(() => data && ops ? healthState(data.checks, ops.issueSummary) : 'Loading', [data, ops])

  if (!data || !ops) {
    return (
      <>
        <ControlCenterStyles />
        <AuthShell
          mode={mode}
          username={username}
          recoveryEmail={recoveryEmail}
          password={password}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          loading={loading}
          changeLoading={changeLoading}
          notice={notice}
          error={error}
          setUsername={setUsername}
          setRecoveryEmail={setRecoveryEmail}
          setPassword={setPassword}
          setNewPassword={setNewPassword}
          setConfirmPassword={setConfirmPassword}
          setMode={(nextMode) => {
            setError('')
            setNotice('')
            setMode(nextMode)
          }}
          onSubmit={authSubmit}
        />
      </>
    )
  }

  const issueMigrationMissing = Boolean(ops.issueSummary.warning)
  const latency = ops.analysisSummary.averageRecentDurationMs ? `${fmt(ops.analysisSummary.averageRecentDurationMs)}ms` : 'n/a'

  return (
    <>
      <ControlCenterStyles />
      <main className="controlShell">
        <aside className="rail">
          <a href="/" className="railLogo" aria-label="GuardScope home"><GuardScopeLogo variant="dark" size={34} textSize={0} /></a>
          {[
            ['overview', 'activity', 'Overview'],
            ['codes', 'codes', 'Codes'],
            ['users', 'users', 'Users'],
            ['scans', 'scan', 'Scans'],
            ['issues', 'issues', 'Issues'],
          ].map(([key, icon, label]) => (
            <button key={key} className={view === key ? 'railButton active' : 'railButton'} onClick={() => setView(key as View)} title={label}>
              <AppIcon name={icon as Parameters<typeof AppIcon>[0]['name']} />
            </button>
          ))}
        </aside>

        <section className="workspace">
          <header className="topbar">
            <div>
              <div className="brandLine">
                <GuardScopeLogo variant="dark" size={28} textSize={17} />
                <StatusPill value={state === 'Healthy' ? 'ok' : state === 'Critical' ? 'missing' : 'watch'} />
              </div>
              <h1>Control Center</h1>
              <p>Owner-only operating view for GuardScope users, launch codes, scans, backend health, and production issues.</p>
            </div>
            <div className="topActions">
              <span className="ownerName">{data.owner.username}</span>
              <button onClick={() => void loadPanel()} className="secondaryButton" disabled={loading}>Refresh</button>
              <button onClick={signOut} className="secondaryButton">Sign out</button>
            </div>
          </header>

          {error && <div className="notice danger surfaceNotice">{error}</div>}

          <section className="metricGrid">
            <MetricCard icon="store" label="Store installs" value={fmt(data.marketplace.installs)} detail={data.marketplace.source} tone={palette.amber} />
            <MetricCard icon="users" label="Accounts" value={fmt(ops.userSummary.total)} detail={`${fmt(ops.userSummary.pro)} pro / ${fmt(ops.userSummary.free)} free`} tone={palette.green} />
            <MetricCard icon="codes" label="Codes left" value={fmt(ops.promoSummary.available)} detail={`${fmt(ops.promoSummary.claimed)} used of ${fmt(ops.promoSummary.total)}`} tone={palette.cyan} />
            <MetricCard icon="scan" label="Scans today" value={fmt(ops.analysisSummary.last24h)} detail={`${fmt(ops.analysisSummary.total)} all-time`} tone={palette.green} />
            <MetricCard icon="issues" label="Open issues" value={fmt(ops.issueSummary.open)} detail={`${fmt(ops.issueSummary.critical)} critical`} tone={ops.issueSummary.critical ? palette.red : palette.amber} />
            <MetricCard icon="health" label="Latency" value={latency} detail="Recent average" tone={palette.cyan} />
          </section>

          {view === 'overview' && (
            <div className="layoutGrid">
              <Panel title="Scan analytics" caption="Last 14 days of stored scan metadata">
                <Sparkline data={ops.analysisSummary.trend14d} />
              </Panel>

              <Panel title="Risk distribution" caption="Recent stored analysis sample">
                <RiskBars buckets={ops.analysisSummary.riskDistribution} />
              </Panel>

              <Panel title="Launch code funnel" caption="Real promo-code inventory from Supabase">
                <div className="funnel">
                  {[
                    ['Total', ops.promoSummary.total, palette.ink],
                    ['Available', ops.promoSummary.available, palette.cyan],
                    ['Assigned', ops.promoSummary.assigned, palette.amber],
                    ['Used', ops.promoSummary.claimed, palette.green],
                    ['Expired', ops.promoSummary.expired, palette.red],
                  ].map(([label, value, color]) => (
                    <div key={label as string} className="funnelRow">
                      <span>{label}</span>
                      <ProgressBar value={ops.promoSummary.total ? ((value as number) / ops.promoSummary.total) * 100 : 0} color={color as string} />
                      <strong>{fmt(value as number)}</strong>
                    </div>
                  ))}
                  <div className="utilization">
                    <strong>{ops.promoSummary.utilizationRate}%</strong>
                    <span>launch-code utilization</span>
                  </div>
                </div>
              </Panel>

              <Panel title="Production health" caption="Live checks and owner warnings">
                <div className="checkList">
                  {data.checks.map((check) => (
                    <div className="checkRow" key={check.label}>
                      <div>
                        <strong>{check.label}</strong>
                        <p>{check.detail}</p>
                      </div>
                      <StatusPill value={check.status} />
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {view === 'codes' && (
            <Panel title="Promo codes" caption="See who requested each code, whether it has been used, and when Pro access expires.">
              {ops.promoSummary.warning && <SourceNotice title="Promo metrics warning" note={ops.promoSummary.warning} />}
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Country</th>
                      <th>Requested</th>
                      <th>Used</th>
                      <th>Pro expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ops.promoSummary.recent.map((row) => (
                      <tr key={`${row.code}-${row.requesterEmail ?? 'empty'}`}>
                        <td className="mono">{row.code}</td>
                        <td><StatusPill value={row.status} /></td>
                        <td>{row.requesterName || 'Unassigned'}</td>
                        <td>{row.requesterEmail || 'No email'}</td>
                        <td>{row.requesterCountry || 'n/a'}</td>
                        <td>{dateLabel(row.createdAt)}</td>
                        <td>{dateLabel(row.claimedAt)}</td>
                        <td>{dateLabel(row.proExpiresAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!ops.promoSummary.recent.length && <EmptyState>No promo-code activity has been recorded yet.</EmptyState>}
              </div>
            </Panel>
          )}

          {view === 'users' && (
            <Panel title="Users" caption="Recent accounts and this month's analysis count.">
              {ops.userSummary.warning && <SourceNotice title="User metrics warning" note={ops.userSummary.warning} />}
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Tier</th>
                      <th>Monthly scans</th>
                      <th>Joined</th>
                      <th>Pro expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ops.userSummary.recent.map((user) => (
                      <tr key={user.id}>
                        <td>{user.email}</td>
                        <td><StatusPill value={user.tier} /></td>
                        <td>{fmt(user.currentMonthAnalyses)}</td>
                        <td>{dateLabel(user.createdAt)}</td>
                        <td>{dateLabel(user.proExpiresAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!ops.userSummary.recent.length && <EmptyState>No users have been recorded yet.</EmptyState>}
              </div>
            </Panel>
          )}

          {view === 'scans' && (
            <div className="layoutGrid">
              <Panel title="Recent scans" caption="Metadata only: sender domain, score, path, and timing.">
                {ops.analysisSummary.warning && <SourceNotice title="Scan metrics warning" note={ops.analysisSummary.warning} />}
                <div className="tableWrap compact">
                  <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Domain</th>
                        <th>Risk</th>
                        <th>Score</th>
                        <th>Path</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ops.analysisSummary.recentScans.map((row) => (
                        <tr key={`${row.analyzedAt}-${row.fromDomain}-${row.riskScore}`}>
                          <td>{dateLabel(row.analyzedAt)}</td>
                          <td>{row.fromDomain}</td>
                          <td><StatusPill value={row.riskLevel} /></td>
                          <td>{row.riskScore}</td>
                          <td>{row.analysisPath}</td>
                          <td>{row.durationMs ? `${fmt(row.durationMs)}ms` : 'n/a'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!ops.analysisSummary.recentScans.length && <EmptyState>No scan metadata has been recorded yet.</EmptyState>}
                </div>
              </Panel>

              <Panel title="High-risk scans" caption="Recent scans with score 70 or higher.">
                <div className="tableWrap compact">
                  <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Domain</th>
                        <th>Risk</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ops.analysisSummary.recentHighRisk.map((row) => (
                        <tr key={`${row.analyzedAt}-${row.fromDomain}-${row.riskScore}`}>
                          <td>{dateLabel(row.analyzedAt)}</td>
                          <td>{row.fromDomain}</td>
                          <td><StatusPill value={row.riskLevel} /></td>
                          <td>{row.riskScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!ops.analysisSummary.recentHighRisk.length && <EmptyState>No high-risk scans in the stored sample.</EmptyState>}
                </div>
              </Panel>
            </div>
          )}

          {view === 'issues' && (
            <Panel title="Issues and bugs" caption="Backend operational events captured by GuardScope.">
              {issueMigrationMissing && <SourceNotice title="Operational event table is not active yet" note={ops.issueSummary.warning ?? data.bugReports.note} />}
              {!issueMigrationMissing && <SourceNotice title="Support sources" note={data.bugReports.note} />}
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Severity</th>
                      <th>Source</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ops.issueSummary.recent.map((issue) => (
                      <tr key={issue.id}>
                        <td>{dateLabel(issue.createdAt)}</td>
                        <td><StatusPill value={issue.severity} /></td>
                        <td>{issue.source}</td>
                        <td>{issue.eventType}</td>
                        <td><StatusPill value={issue.status} /></td>
                        <td>{issue.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!ops.issueSummary.recent.length && <EmptyState>No operational issues recorded. Keep checking support email and Chrome Web Store reviews for user-submitted bugs.</EmptyState>}
              </div>
            </Panel>
          )}

          <section className="sourceGrid">
            <SourceNotice title="Chrome Web Store installs" note={data.marketplace.note} />
            <SourceNotice title="Data handling" note="The Control Center reads operational metadata only. It does not display or store users' scanned email bodies, subjects, recipients, or headers." />
          </section>

          <footer className="dashboardFooter">
            <span>Last refreshed {new Date(data.generatedAt).toLocaleString()}</span>
            <a href={data.listingUrl} target="_blank" rel="noreferrer">Chrome Web Store</a>
            <a href={data.websiteUrl} target="_blank" rel="noreferrer">Website</a>
          </footer>
        </section>
      </main>
    </>
  )
}

function ControlCenterStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      body { margin: 0; background: ${palette.bg}; }
      button, input { font: inherit; }
      .loginShell { min-height: 100vh; background: linear-gradient(180deg,#f8fcff 0%,#edf6fb 100%); padding: 20px; position: relative; overflow: hidden; }
      .watermarkField { position: fixed; inset: 0; overflow: hidden; z-index: 0; pointer-events: none; }
      .watermarkItem { position: absolute; opacity: 0.075; filter: drop-shadow(0 18px 22px rgba(6,27,43,0.2)); will-change: transform; }
      .watermarkItem svg { width: 100%; height: 100%; }
      .guardMark { width: 100%; height: 100%; display: grid; place-items: center; }
      .loginCenter { min-height: calc(100vh - 40px); display: grid; place-items: center; position: relative; z-index: 1; }
      .loginStack { width: min(390px, 100%); display: grid; gap: 22px; justify-items: center; }
      .loginLogo { display: inline-flex; text-decoration: none; }
      .loginCard { width: 100%; display: grid; gap: 12px; background: rgba(255,255,255,0.86); border: 1px solid rgba(216,228,236,0.92); border-radius: 8px; padding: 22px; box-shadow: 0 24px 70px rgba(6,27,43,0.13); backdrop-filter: blur(18px); }
      .field { display: grid; gap: 7px; color: ${palette.text}; font-size: 13px; font-weight: 760; }
      .field input { height: 48px; border: 1px solid ${palette.line}; border-radius: 8px; padding: 0 13px; color: ${palette.text}; background: #fff; outline: none; }
      .field input:focus { border-color: ${palette.cyan}; box-shadow: 0 0 0 4px rgba(7,150,201,0.1); }
      .primaryButton, .secondaryButton, .railButton { transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease; }
      .primaryButton { height: 48px; border: 0; border-radius: 8px; background: ${palette.ink}; color: #fff; font-size: 14px; font-weight: 840; cursor: pointer; }
      .primaryButton:disabled { opacity: 0.72; cursor: wait; }
      .linkButton { justify-self: center; color: ${palette.cyan}; font-size: 13px; font-weight: 760; background: transparent; border: 0; cursor: pointer; }
      .linkButton.muted { color: ${palette.muted}; }
      .formHint { color: ${palette.body}; font-size: 13px; text-align: center; }
      .notice { border-radius: 8px; padding: 11px; font-size: 12px; line-height: 1.5; }
      .notice.success { border: 1px solid rgba(21,138,75,0.24); background: ${palette.greenSoft}; color: #126b37; }
      .notice.danger { border: 1px solid rgba(198,56,56,0.24); background: ${palette.redSoft}; color: #8b2020; }
      .surfaceNotice { margin-bottom: 14px; }
      .controlShell { min-height: 100vh; background: radial-gradient(circle at top left, rgba(7,150,201,0.12), transparent 34%), ${palette.bg}; color: ${palette.text}; display: grid; grid-template-columns: 74px 1fr; }
      .rail { position: sticky; top: 0; height: 100vh; padding: 18px 12px; border-right: 1px solid rgba(216,228,236,0.9); background: rgba(255,255,255,0.76); backdrop-filter: blur(18px); display: flex; flex-direction: column; align-items: center; gap: 12px; }
      .railLogo { width: 46px; height: 46px; border-radius: 8px; display: grid; place-items: center; background: ${palette.panel}; border: 1px solid ${palette.line}; }
      .railButton { width: 46px; height: 46px; border: 1px solid transparent; border-radius: 8px; display: grid; place-items: center; background: transparent; color: ${palette.body}; cursor: pointer; }
      .railButton:hover, .railButton.active { background: ${palette.cyanSoft}; border-color: rgba(7,150,201,0.2); color: ${palette.cyan}; }
      .icon { width: 20px; height: 20px; }
      .workspace { width: min(1420px, 100%); padding: 24px 24px 44px; }
      .topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 22px; margin-bottom: 18px; }
      .brandLine { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
      .topbar h1 { margin: 0; font-size: clamp(34px, 5vw, 58px); line-height: 1; color: ${palette.ink}; }
      .topbar p { margin: 10px 0 0; color: ${palette.body}; max-width: 720px; font-size: 15px; line-height: 1.65; }
      .topActions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
      .ownerName { padding: 9px 12px; border: 1px solid ${palette.line}; border-radius: 8px; color: ${palette.body}; background: #fff; font-size: 13px; font-weight: 760; }
      .secondaryButton { border: 1px solid ${palette.line}; background: #fff; border-radius: 8px; color: ${palette.text}; padding: 10px 13px; font-size: 13px; font-weight: 800; cursor: pointer; }
      .secondaryButton:hover { border-color: ${palette.cyan}; color: ${palette.cyan}; }
      .metricGrid { display: grid; grid-template-columns: repeat(6, minmax(146px, 1fr)); gap: 12px; margin-bottom: 16px; }
      .metric, .panel { background: rgba(255,255,255,0.94); border: 1px solid rgba(216,228,236,0.96); border-radius: 8px; box-shadow: 0 16px 50px rgba(6,23,36,0.055); }
      .metric { padding: 16px; min-height: 132px; }
      .metricTop { display: flex; align-items: center; gap: 9px; min-height: 26px; }
      .metricIcon { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; }
      .metricIcon .icon { width: 17px; height: 17px; }
      .metricLabel { color: ${palette.muted}; font-size: 11px; font-weight: 860; text-transform: uppercase; }
      .metricValue { color: ${palette.ink}; font-size: 31px; font-weight: 920; line-height: 1.05; margin-top: 16px; }
      .metricDetail { font-size: 12px; font-weight: 780; margin-top: 9px; }
      .layoutGrid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr); gap: 16px; align-items: start; }
      .panel { padding: 20px; min-width: 0; }
      .panelHeader { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 16px; }
      .panel h2 { margin: 0; color: ${palette.ink}; font-size: 18px; line-height: 1.2; }
      .panel p { margin: 5px 0 0; color: ${palette.body}; font-size: 13px; line-height: 1.55; }
      .pill { display: inline-flex; align-items: center; justify-content: center; min-height: 26px; padding: 4px 8px; border: 1px solid; border-radius: 999px; font-size: 11px; font-weight: 850; text-transform: capitalize; white-space: nowrap; }
      .chartWrap { min-height: 220px; }
      .chartWrap svg { width: 100%; height: auto; display: block; }
      .chartTicks { display: flex; justify-content: space-between; color: ${palette.muted}; font-size: 11px; font-weight: 760; margin-top: 8px; }
      .riskBars, .funnel, .checkList { display: grid; gap: 12px; }
      .riskRow, .funnelRow { display: grid; grid-template-columns: 82px 1fr 46px; align-items: center; gap: 10px; color: ${palette.body}; font-size: 12px; font-weight: 760; }
      .riskRow strong, .funnelRow strong { color: ${palette.ink}; text-align: right; }
      .progressTrack { height: 8px; background: #ecf2f6; border-radius: 999px; overflow: hidden; }
      .progressFill { height: 100%; border-radius: inherit; }
      .utilization { border: 1px solid ${palette.line}; border-radius: 8px; padding: 13px; background: ${palette.panelSoft}; display: flex; align-items: center; justify-content: space-between; gap: 12px; color: ${palette.body}; font-size: 13px; }
      .utilization strong { color: ${palette.cyan}; font-size: 26px; }
      .checkRow { display: flex; justify-content: space-between; gap: 14px; border: 1px solid ${palette.line}; border-radius: 8px; padding: 12px; }
      .checkRow strong { color: ${palette.ink}; font-size: 13px; }
      .checkRow p { margin-top: 5px; }
      .sourceNotice { border: 1px solid ${palette.line}; border-left: 4px solid ${palette.amber}; border-radius: 8px; padding: 13px; background: #fffaf0; margin-bottom: 14px; }
      .sourceNotice strong { color: ${palette.ink}; font-size: 13px; }
      .sourceNotice p { color: ${palette.body}; font-size: 13px; line-height: 1.55; margin: 5px 0 0; }
      .tableWrap { width: 100%; overflow-x: auto; }
      .tableWrap table { width: 100%; min-width: 920px; border-collapse: collapse; }
      .tableWrap.compact table { min-width: 720px; }
      th { text-align: left; color: ${palette.muted}; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid ${palette.line}; padding: 10px 8px; white-space: nowrap; }
      td { color: ${palette.body}; font-size: 12px; border-bottom: 1px solid ${palette.line}; padding: 12px 8px; vertical-align: middle; }
      td:first-child { color: ${palette.text}; font-weight: 760; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: ${palette.ink}; }
      .emptyState { border: 1px dashed ${palette.line}; border-radius: 8px; padding: 22px; color: ${palette.body}; font-size: 13px; text-align: center; background: ${palette.panelSoft}; }
      .sourceGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
      .dashboardFooter { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; color: ${palette.muted}; font-size: 12px; margin-top: 8px; }
      .dashboardFooter a { color: ${palette.cyan}; text-decoration: none; font-weight: 780; }
      @media (max-width: 1180px) {
        .metricGrid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .layoutGrid { grid-template-columns: 1fr; }
      }
      @media (max-width: 760px) {
        .controlShell { grid-template-columns: 1fr; }
        .rail { position: sticky; bottom: 0; top: auto; height: auto; flex-direction: row; justify-content: center; order: 2; border-right: 0; border-top: 1px solid ${palette.line}; z-index: 3; }
        .workspace { padding: 18px 14px 96px; }
        .topbar { flex-direction: column; }
        .metricGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .sourceGrid { grid-template-columns: 1fr; }
        .metricValue { font-size: 26px; }
      }
    `}</style>
  )
}

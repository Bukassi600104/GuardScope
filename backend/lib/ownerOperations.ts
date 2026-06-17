const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''

type MetricResult<T> = {
  data: T
  warning?: string
}

export type OwnerOperationsSnapshot = {
  promoSummary: PromoSummary
  userSummary: UserSummary
  analysisSummary: AnalysisSummary
  issueSummary: IssueSummary
  extensionSummary: ExtensionSummary
}

export type PromoSummary = {
  total: number
  available: number
  assigned: number
  claimed: number
  expired: number
  requests24h: number
  blockedAttempts24h: number
  utilizationRate: number
  recent: PromoActivity[]
  recentAttempts: PromoAttempt[]
  warning?: string
}

export type PromoActivity = {
  code: string
  status: string
  requesterName: string | null
  requesterEmail: string | null
  requesterCountry: string | null
  createdAt: string | null
  assignedAt: string | null
  claimDeadline: string | null
  claimedAt: string | null
  proExpiresAt: string | null
}

export type PromoAttempt = {
  emailDomain: string | null
  allowed: boolean
  reason: string
  createdAt: string
}

export type UserSummary = {
  total: number
  free: number
  pro: number
  team: number
  currentMonthAnalyses: number
  recent: UserActivity[]
  warning?: string
}

export type UserActivity = {
  id: string
  email: string
  tier: string
  proExpiresAt: string | null
  createdAt: string
  currentMonthAnalyses: number
}

export type AnalysisSummary = {
  total: number
  last24h: number
  highRisk30d: number
  averageRecentScore: number | null
  averageRecentDurationMs: number | null
  trend14d: TrendPoint[]
  riskDistribution: RiskBucket[]
  recentHighRisk: HighRiskScan[]
  recentScans: RecentScan[]
  warning?: string
}

export type TrendPoint = {
  date: string
  scans: number
}

export type RiskBucket = {
  label: string
  count: number
}

export type HighRiskScan = {
  fromDomain: string
  riskLevel: string
  riskScore: number
  analysisPath: string
  durationMs: number | null
  analyzedAt: string
}

export type RecentScan = HighRiskScan

export type IssueSummary = {
  open: number
  critical: number
  last24h: number
  recent: OperationalIssue[]
  warning?: string
}

export type OperationalIssue = {
  id: string
  severity: string
  source: string
  eventType: string
  message: string
  status: string
  createdAt: string
}

export type ExtensionSummary = {
  installs: number
  uninstalls: number
  activeApproximate: number
  installs24h: number
  updates24h: number
  events24h: number
  warning?: string
}

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SERVICE_KEY)
}

function serviceHeaders(extra?: Record<string, string>) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

function tableUrl(table: string, query: string) {
  return `${SUPABASE_URL}/rest/v1/${table}?${query}`
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function countRows(table: string, query: string): Promise<number> {
  if (!hasSupabaseConfig()) return 0

  const separator = query ? '&' : ''
  const res = await fetchWithTimeout(tableUrl(table, `${query}${separator}select=id`), {
    headers: serviceHeaders({ Prefer: 'count=exact' }),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`${table} count failed with ${res.status}`)
  }

  const count = res.headers.get('content-range')?.split('/')[1]
  return count && count !== '*' ? parseInt(count, 10) : 0
}

async function selectRows<T>(table: string, query: string): Promise<T[]> {
  if (!hasSupabaseConfig()) return []

  const res = await fetchWithTimeout(tableUrl(table, query), {
    headers: serviceHeaders(),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`${table} select failed with ${res.status}`)
  }

  return (await res.json()) as T[]
}

async function safeMetric<T>(fallback: T, read: () => Promise<T>): Promise<MetricResult<T>> {
  try {
    return { data: await read() }
  } catch (error) {
    return {
      data: fallback,
      warning: error instanceof Error ? error.message : 'Metric unavailable',
    }
  }
}

function isoDaysBack(days: number) {
  return encodeURIComponent(new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
}

function dayKey(value: string) {
  return new Date(value).toISOString().slice(0, 10)
}

function buildEmptyTrend(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.now() - (days - index - 1) * 24 * 60 * 60 * 1000)
    return { date: date.toISOString().slice(0, 10), scans: 0 }
  })
}

function percentage(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

async function getPromoSummary() {
  const fallback: PromoSummary = {
    total: 0,
    available: 0,
    assigned: 0,
    claimed: 0,
    expired: 0,
    requests24h: 0,
    blockedAttempts24h: 0,
    utilizationRate: 0,
    recent: [],
    recentAttempts: [],
  }

  return safeMetric(fallback, async () => {
    const now = encodeURIComponent(new Date().toISOString())
    const [total, available, assigned, claimed, expired, requests24h, blockedAttempts24h, recentRows, attemptRows] = await Promise.all([
      countRows('promo_codes', ''),
      countRows('promo_codes', `status=eq.unused&requester_email=is.null&claim_deadline=gt.${now}`),
      countRows('promo_codes', 'status=eq.unused&requester_email=not.is.null'),
      countRows('promo_codes', 'status=eq.claimed'),
      countRows('promo_codes', 'status=eq.expired'),
      countRows('promo_claim_attempts', `allowed=eq.true&created_at=gte.${isoDaysBack(1)}`),
      countRows('promo_claim_attempts', `allowed=eq.false&created_at=gte.${isoDaysBack(1)}`),
      selectRows<{
        code: string
        status: string
        requester_name: string | null
        requester_email: string | null
        requester_country: string | null
        created_at: string | null
        assigned_at: string | null
        claim_deadline: string | null
        claimed_at: string | null
        pro_expires_at: string | null
      }>(
        'promo_codes',
        'select=code,status,requester_name,requester_email,requester_country,created_at,assigned_at,claim_deadline,claimed_at,pro_expires_at&requester_email=not.is.null&order=assigned_at.desc.nullslast,created_at.desc&limit=30'
      ),
      selectRows<{
        email_domain: string | null
        allowed: boolean
        reason: string
        created_at: string
      }>(
        'promo_claim_attempts',
        'select=email_domain,allowed,reason,created_at&order=created_at.desc&limit=20'
      ),
    ])

    return {
      total,
      available,
      assigned,
      claimed,
      expired,
      requests24h,
      blockedAttempts24h,
      utilizationRate: percentage(claimed, total),
      recent: recentRows.map((row) => ({
        code: row.code,
        status: row.status,
        requesterName: row.requester_name,
        requesterEmail: row.requester_email,
        requesterCountry: row.requester_country,
        createdAt: row.created_at,
        assignedAt: row.assigned_at,
        claimDeadline: row.claim_deadline,
        claimedAt: row.claimed_at,
        proExpiresAt: row.pro_expires_at,
      })),
      recentAttempts: attemptRows.map((row) => ({
        emailDomain: row.email_domain,
        allowed: row.allowed,
        reason: row.reason,
        createdAt: row.created_at,
      })),
    }
  })
}

async function getUserSummary() {
  const fallback: UserSummary = {
    total: 0,
    free: 0,
    pro: 0,
    team: 0,
    currentMonthAnalyses: 0,
    recent: [],
  }

  return safeMetric(fallback, async () => {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    const [total, free, pro, team, usageRows, recentUsers] = await Promise.all([
      countRows('users', ''),
      countRows('users', 'tier=eq.free'),
      countRows('users', 'tier=eq.pro'),
      countRows('users', 'tier=eq.team'),
      selectRows<{ user_id: string; analysis_count: number }>(
        'usage',
        `select=user_id,analysis_count&month=eq.${month}&year=eq.${year}&limit=5000`
      ),
      selectRows<{
        id: string
        email: string
        tier: string
        pro_expires_at: string | null
        created_at: string
      }>(
        'users',
        'select=id,email,tier,pro_expires_at,created_at&order=created_at.desc&limit=20'
      ),
    ])

    const usageByUser = new Map(usageRows.map((row) => [row.user_id, row.analysis_count ?? 0]))

    return {
      total,
      free,
      pro,
      team,
      currentMonthAnalyses: usageRows.reduce((sum, row) => sum + (row.analysis_count ?? 0), 0),
      recent: recentUsers.map((user) => ({
        id: user.id,
        email: user.email,
        tier: user.tier,
        proExpiresAt: user.pro_expires_at,
        createdAt: user.created_at,
        currentMonthAnalyses: usageByUser.get(user.id) ?? 0,
      })),
    }
  })
}

async function getAnalysisSummary() {
  const fallback: AnalysisSummary = {
    total: 0,
    last24h: 0,
    highRisk30d: 0,
    averageRecentScore: null,
    averageRecentDurationMs: null,
    trend14d: buildEmptyTrend(14),
    riskDistribution: [
      { label: 'SAFE', count: 0 },
      { label: 'LOW', count: 0 },
      { label: 'MEDIUM', count: 0 },
      { label: 'HIGH', count: 0 },
      { label: 'CRITICAL', count: 0 },
    ],
    recentHighRisk: [],
    recentScans: [],
  }

  return safeMetric(fallback, async () => {
    const [total, last24h, highRisk30d, recentRows, trendRows, highRiskRows] = await Promise.all([
      countRows('analysis_history', ''),
      countRows('analysis_history', `analyzed_at=gte.${isoDaysBack(1)}`),
      countRows('analysis_history', `analyzed_at=gte.${isoDaysBack(30)}&risk_score=gte.70`),
      selectRows<{
        from_domain: string
        risk_level: string
        risk_score: number
        analysis_path: string
        duration_ms: number | null
        analyzed_at: string
      }>(
        'analysis_history',
        'select=from_domain,risk_level,risk_score,analysis_path,duration_ms,analyzed_at&order=analyzed_at.desc&limit=250'
      ),
      selectRows<{ analyzed_at: string }>(
        'analysis_history',
        `select=analyzed_at&analyzed_at=gte.${isoDaysBack(14)}&limit=5000`
      ),
      selectRows<{
        from_domain: string
        risk_level: string
        risk_score: number
        analysis_path: string
        duration_ms: number | null
        analyzed_at: string
      }>(
        'analysis_history',
        'select=from_domain,risk_level,risk_score,analysis_path,duration_ms,analyzed_at&risk_score=gte.70&order=analyzed_at.desc&limit=20'
      ),
    ])

    const scoreRows = recentRows.filter((row) => typeof row.risk_score === 'number')
    const durationRows = recentRows.filter((row) => typeof row.duration_ms === 'number')
    const trend = buildEmptyTrend(14)
    const trendByDay = new Map(trend.map((point) => [point.date, point]))
    trendRows.forEach((row) => {
      const point = trendByDay.get(dayKey(row.analyzed_at))
      if (point) point.scans += 1
    })

    const buckets = new Map<string, number>([
      ['SAFE', 0],
      ['LOW', 0],
      ['MEDIUM', 0],
      ['HIGH', 0],
      ['CRITICAL', 0],
    ])
    recentRows.forEach((row) => {
      const level = (row.risk_level || 'LOW').toUpperCase()
      buckets.set(level, (buckets.get(level) ?? 0) + 1)
    })

    const normalizeScan = (row: typeof recentRows[number]) => ({
      fromDomain: row.from_domain,
      riskLevel: row.risk_level,
      riskScore: row.risk_score,
      analysisPath: row.analysis_path,
      durationMs: row.duration_ms,
      analyzedAt: row.analyzed_at,
    })

    return {
      total,
      last24h,
      highRisk30d,
      averageRecentScore: scoreRows.length
        ? Math.round(scoreRows.reduce((sum, row) => sum + row.risk_score, 0) / scoreRows.length)
        : null,
      averageRecentDurationMs: durationRows.length
        ? Math.round(durationRows.reduce((sum, row) => sum + (row.duration_ms ?? 0), 0) / durationRows.length)
        : null,
      trend14d: trend,
      riskDistribution: Array.from(buckets, ([label, count]) => ({ label, count })),
      recentHighRisk: highRiskRows.map(normalizeScan),
      recentScans: recentRows.slice(0, 20).map(normalizeScan),
    }
  })
}

async function getIssueSummary() {
  const fallback: IssueSummary = {
    open: 0,
    critical: 0,
    last24h: 0,
    recent: [],
  }

  return safeMetric(fallback, async () => {
    const [open, critical, last24h, rows] = await Promise.all([
      countRows('operational_events', 'status=neq.resolved'),
      countRows('operational_events', 'status=neq.resolved&severity=eq.critical'),
      countRows('operational_events', `created_at=gte.${isoDaysBack(1)}`),
      selectRows<{
        id: string
        severity: string
        source: string
        event_type: string
        message: string
        status: string
        created_at: string
      }>(
        'operational_events',
        'select=id,severity,source,event_type,message,status,created_at&order=created_at.desc&limit=20'
      ),
    ])

    return {
      open,
      critical,
      last24h,
      recent: rows.map((row) => ({
        id: row.id,
        severity: row.severity,
        source: row.source,
        eventType: row.event_type,
        message: row.message,
        status: row.status,
        createdAt: row.created_at,
      })),
    }
  })
}

async function getExtensionSummary() {
  const fallback: ExtensionSummary = {
    installs: 0,
    uninstalls: 0,
    activeApproximate: 0,
    installs24h: 0,
    updates24h: 0,
    events24h: 0,
  }

  return safeMetric(fallback, async () => {
    const [installs, uninstalls, installs24h, updates24h, events24h] = await Promise.all([
      countRows('extension_installations', ''),
      countRows('extension_installations', 'uninstalled_at=not.is.null'),
      countRows('extension_lifecycle_events', `event_type=eq.install&created_at=gte.${isoDaysBack(1)}`),
      countRows('extension_lifecycle_events', `event_type=eq.update&created_at=gte.${isoDaysBack(1)}`),
      countRows('extension_lifecycle_events', `created_at=gte.${isoDaysBack(1)}`),
    ])

    return {
      installs,
      uninstalls,
      activeApproximate: Math.max(0, installs - uninstalls),
      installs24h,
      updates24h,
      events24h,
    }
  })
}

export async function getOwnerOperationsSnapshot(): Promise<OwnerOperationsSnapshot> {
  const [promo, users, analyses, issues, extension] = await Promise.all([
    getPromoSummary(),
    getUserSummary(),
    getAnalysisSummary(),
    getIssueSummary(),
    getExtensionSummary(),
  ])

  return {
    promoSummary: { ...promo.data, ...(promo.warning ? { warning: promo.warning } : {}) },
    userSummary: { ...users.data, ...(users.warning ? { warning: users.warning } : {}) },
    analysisSummary: { ...analyses.data, ...(analyses.warning ? { warning: analyses.warning } : {}) },
    issueSummary: { ...issues.data, ...(issues.warning ? { warning: issues.warning } : {}) },
    extensionSummary: { ...extension.data, ...(extension.warning ? { warning: extension.warning } : {}) },
  }
}

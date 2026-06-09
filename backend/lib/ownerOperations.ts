const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''

type MetricResult<T> = {
  data: T
  warning?: string
}

export type OwnerOperationsSnapshot = {
  promoSummary: {
    total: number
    available: number
    assigned: number
    claimed: number
    expired: number
    recent: PromoActivity[]
    warning?: string
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

export type PromoActivity = {
  code: string
  status: string
  requesterName: string | null
  requesterEmail: string | null
  requesterCountry: string | null
  claimedAt: string | null
  proExpiresAt: string | null
}

export type HighRiskScan = {
  fromDomain: string
  riskLevel: string
  riskScore: number
  analysisPath: string
  durationMs: number | null
  analyzedAt: string
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

async function getPromoSummary() {
  const fallback = {
    total: 0,
    available: 0,
    assigned: 0,
    claimed: 0,
    expired: 0,
    recent: [] as PromoActivity[],
  }

  return safeMetric(fallback, async () => {
    const now = encodeURIComponent(new Date().toISOString())
    const [total, available, assigned, claimed, expired, recentRows] = await Promise.all([
      countRows('promo_codes', ''),
      countRows('promo_codes', `status=eq.unused&requester_email=is.null&claim_deadline=gt.${now}`),
      countRows('promo_codes', 'status=eq.unused&requester_email=not.is.null'),
      countRows('promo_codes', 'status=eq.claimed'),
      countRows('promo_codes', 'status=eq.expired'),
      selectRows<{
        code: string
        status: string
        requester_name: string | null
        requester_email: string | null
        requester_country: string | null
        claimed_at: string | null
        pro_expires_at: string | null
      }>(
        'promo_codes',
        'select=code,status,requester_name,requester_email,requester_country,claimed_at,pro_expires_at&requester_email=not.is.null&order=claimed_at.desc.nullslast,created_at.desc&limit=8'
      ),
    ])

    return {
      total,
      available,
      assigned,
      claimed,
      expired,
      recent: recentRows.map((row) => ({
        code: row.code,
        status: row.status,
        requesterName: row.requester_name,
        requesterEmail: row.requester_email,
        requesterCountry: row.requester_country,
        claimedAt: row.claimed_at,
        proExpiresAt: row.pro_expires_at,
      })),
    }
  })
}

async function getUserSummary() {
  const fallback = {
    total: 0,
    free: 0,
    pro: 0,
    team: 0,
    currentMonthAnalyses: 0,
  }

  return safeMetric(fallback, async () => {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    const [total, free, pro, team, usageRows] = await Promise.all([
      countRows('users', ''),
      countRows('users', 'tier=eq.free'),
      countRows('users', 'tier=eq.pro'),
      countRows('users', 'tier=eq.team'),
      selectRows<{ analysis_count: number }>(
        'usage',
        `select=analysis_count&month=eq.${month}&year=eq.${year}&limit=1000`
      ),
    ])

    return {
      total,
      free,
      pro,
      team,
      currentMonthAnalyses: usageRows.reduce((sum, row) => sum + (row.analysis_count ?? 0), 0),
    }
  })
}

async function getAnalysisSummary() {
  const fallback = {
    total: 0,
    last24h: 0,
    highRisk30d: 0,
    averageRecentScore: null as number | null,
    averageRecentDurationMs: null as number | null,
  }

  return safeMetric(fallback, async () => {
    const oneDayAgo = encodeURIComponent(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    const thirtyDaysAgo = encodeURIComponent(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    const [total, last24h, highRisk30d, recentRows] = await Promise.all([
      countRows('analysis_history', ''),
      countRows('analysis_history', `analyzed_at=gte.${oneDayAgo}`),
      countRows('analysis_history', `analyzed_at=gte.${thirtyDaysAgo}&risk_score=gte.70`),
      selectRows<{ risk_score: number; duration_ms: number | null }>(
        'analysis_history',
        'select=risk_score,duration_ms&order=analyzed_at.desc&limit=250'
      ),
    ])

    const scoreRows = recentRows.filter((row) => typeof row.risk_score === 'number')
    const durationRows = recentRows.filter((row) => typeof row.duration_ms === 'number')

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
    }
  })
}

async function getRecentHighRisk() {
  return safeMetric([] as HighRiskScan[], async () => {
    const rows = await selectRows<{
      from_domain: string
      risk_level: string
      risk_score: number
      analysis_path: string
      duration_ms: number | null
      analyzed_at: string
    }>(
      'analysis_history',
      'select=from_domain,risk_level,risk_score,analysis_path,duration_ms,analyzed_at&risk_score=gte.70&order=analyzed_at.desc&limit=8'
    )

    return rows.map((row) => ({
      fromDomain: row.from_domain,
      riskLevel: row.risk_level,
      riskScore: row.risk_score,
      analysisPath: row.analysis_path,
      durationMs: row.duration_ms,
      analyzedAt: row.analyzed_at,
    }))
  })
}

export async function getOwnerOperationsSnapshot(): Promise<OwnerOperationsSnapshot> {
  const [promo, users, analyses, highRisk] = await Promise.all([
    getPromoSummary(),
    getUserSummary(),
    getAnalysisSummary(),
    getRecentHighRisk(),
  ])

  return {
    promoSummary: { ...promo.data, ...(promo.warning ? { warning: promo.warning } : {}) },
    userSummary: { ...users.data, ...(users.warning ? { warning: users.warning } : {}) },
    analysisSummary: { ...analyses.data, ...(analyses.warning ? { warning: analyses.warning } : {}) },
    recentHighRisk: highRisk.data,
  }
}

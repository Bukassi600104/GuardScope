import { NextRequest, NextResponse } from 'next/server'
import { buildCorsHeaders } from '../../../../lib/cors'
import { checkRateLimit } from '../../../../lib/ratelimit'
import { hasHashSecret, securityHash } from '../../../../lib/securityHash'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''
const PUBLISHED_EXTENSION_ID = 'fbjajjiepjmcmkcidfbmjbjmmegokhif'
const PUBLISHED_EXTENSION_ORIGIN = `chrome-extension://${PUBLISHED_EXTENSION_ID}`
const EVENT_TYPES = ['install', 'update', 'uninstall'] as const
type LifecycleEventType = (typeof EVENT_TYPES)[number]
const EVENT_TYPE_SET = new Set<string>(EVENT_TYPES)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function headers(req: NextRequest, methods = 'POST, GET, OPTIONS') {
  return {
    ...buildCorsHeaders(req, methods),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
  }
}

function serviceHeaders(extra?: Record<string, string>) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

function ipOf(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

function cleanVersion(value: unknown) {
  return typeof value === 'string' && /^[0-9A-Za-z._-]{1,32}$/.test(value) ? value : null
}

function cleanEventType(value: unknown) {
  return typeof value === 'string' && EVENT_TYPE_SET.has(value) ? value as LifecycleEventType : null
}

function cleanInstallId(value: unknown) {
  return typeof value === 'string' && UUID_RE.test(value) ? value : null
}

function hasConfig() {
  return Boolean(SUPABASE_URL && SERVICE_KEY && hasHashSecret())
}

function isProductionRuntime() {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
}

function isAllowedTelemetryOrigin(req: NextRequest) {
  const origin = req.headers.get('origin') ?? ''
  if (!isProductionRuntime()) return true
  return origin === PUBLISHED_EXTENSION_ORIGIN
}

async function writeLifecycleEvent(input: {
  installId: string
  eventType: LifecycleEventType
  version: string
  previousVersion?: string | null
}) {
  if (!hasConfig()) {
    throw new Error('Extension lifecycle telemetry is not configured.')
  }

  const now = new Date().toISOString()
  const installIdHash = securityHash(`extension-install:${input.installId}`)

  if (!installIdHash) {
    throw new Error('Extension lifecycle hashing is not configured.')
  }

  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/extension_installations?install_id_hash=eq.${encodeURIComponent(installIdHash)}&select=install_id_hash,event_count&limit=1`,
    {
      headers: serviceHeaders(),
      cache: 'no-store',
    },
  )

  if (!existingRes.ok) {
    throw new Error(`Lifecycle lookup failed with ${existingRes.status}.`)
  }

  const existing = (await existingRes.json()) as Array<{ install_id_hash: string; event_count: number }>
  const eventCount = (existing[0]?.event_count ?? 0) + 1
  const body = {
    install_id_hash: installIdHash,
    extension_id: PUBLISHED_EXTENSION_ID,
    version: input.version,
    installed_at: input.eventType === 'install' && !existing.length ? now : undefined,
    updated_at: input.eventType === 'update' ? now : undefined,
    uninstalled_at: input.eventType === 'uninstall' ? now : null,
    last_event_at: now,
    event_count: eventCount,
  }

  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/extension_installations`, {
    method: 'POST',
    headers: serviceHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify(body),
  })

  if (!upsertRes.ok) {
    throw new Error(`Lifecycle upsert failed with ${upsertRes.status}.`)
  }

  const eventRes = await fetch(`${SUPABASE_URL}/rest/v1/extension_lifecycle_events`, {
    method: 'POST',
    headers: serviceHeaders({ Prefer: 'return=minimal' }),
    body: JSON.stringify({
      install_id_hash: installIdHash,
      event_type: input.eventType,
      extension_id: PUBLISHED_EXTENSION_ID,
      version: input.version,
      previous_version: input.previousVersion ?? null,
      created_at: now,
    }),
  })

  if (!eventRes.ok) {
    throw new Error(`Lifecycle event insert failed with ${eventRes.status}.`)
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: headers(req) })
}

export async function POST(req: NextRequest) {
  const resHeaders = headers(req)
  if (!isAllowedTelemetryOrigin(req)) {
    return NextResponse.json({ error: 'Lifecycle telemetry origin is not allowed.' }, { status: 403, headers: resHeaders })
  }

  const ip = ipOf(req)
  const rate = await checkRateLimit(`extension-lifecycle:${ip}`, false)
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many lifecycle events.' }, { status: 429, headers: resHeaders })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: resHeaders })
  }

  const installId = cleanInstallId(body.install_id)
  const eventType = cleanEventType(body.event_type)
  const version = cleanVersion(body.version)
  const previousVersion = cleanVersion(body.previous_version)

  if (!installId || !eventType || !version) {
    return NextResponse.json({ error: 'Invalid lifecycle event.' }, { status: 400, headers: resHeaders })
  }

  try {
    await writeLifecycleEvent({ installId, eventType, version, previousVersion })
    return NextResponse.json({ ok: true }, { headers: resHeaders })
  } catch {
    return NextResponse.json({ error: 'Lifecycle telemetry unavailable.' }, { status: 503, headers: resHeaders })
  }
}

export async function GET(req: NextRequest) {
  const resHeaders = headers(req, 'GET, OPTIONS')
  const installId = cleanInstallId(req.nextUrl.searchParams.get('install_id'))
  const version = cleanVersion(req.nextUrl.searchParams.get('version')) ?? 'unknown'

  if (installId) {
    try {
      await writeLifecycleEvent({ installId, eventType: 'uninstall', version })
    } catch {
      // The uninstall page should still load even if telemetry storage is unavailable.
    }
  }

  return new Response(
    '<!doctype html><html><head><meta charset="utf-8"><title>GuardScope uninstalled</title></head><body style="font-family:Arial,sans-serif;padding:32px;color:#061b2b"><h1>GuardScope was removed</h1><p>Thanks for trying GuardScope. You can reinstall it any time from guardscope.app.</p></body></html>',
    {
      status: 200,
      headers: {
        ...resHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    },
  )
}

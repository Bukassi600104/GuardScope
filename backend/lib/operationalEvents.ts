const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').trim()
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? '').trim()

type OperationalEventInput = {
  severity: 'info' | 'warning' | 'error' | 'critical'
  source: string
  eventType: string
  message: string
  metadata?: Record<string, string | number | boolean | null>
}

function hasConfig() {
  return Boolean(SUPABASE_URL && SERVICE_KEY)
}

function sanitizeMessage(message: string) {
  return message.replace(/[^\S\r\n]+/g, ' ').trim().slice(0, 500)
}

function sanitizeMetadata(metadata: OperationalEventInput['metadata']) {
  if (!metadata) return {}

  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => !/email|subject|body|header|recipient/i.test(key))
      .map(([key, value]) => [key.slice(0, 60), typeof value === 'string' ? value.slice(0, 160) : value])
  )
}

export async function logOperationalEvent(input: OperationalEventInput) {
  if (!hasConfig()) return

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/operational_events`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({
        severity: input.severity,
        source: input.source.slice(0, 80),
        event_type: input.eventType.slice(0, 80),
        message: sanitizeMessage(input.message),
        metadata: sanitizeMetadata(input.metadata),
      }),
    })
  } catch {
    // Operational logging must never break user-facing flows.
  }
}

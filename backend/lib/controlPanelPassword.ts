import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scrypt = promisify(scryptCallback)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''
const BOOTSTRAP_HASH = (process.env.CONTROL_PANEL_BOOTSTRAP_PASSWORD_HASH ?? '').trim()
const SESSION_SECRET = (process.env.CONTROL_PANEL_SESSION_SECRET ?? process.env.SUPABASE_JWT_SECRET ?? '').trim()
const SESSION_TTL_SECONDS = 60 * 60 * 8
const SETUP_TTL_SECONDS = 60 * 10

type CredentialRow = {
  id: 'owner'
  password_hash: string
  password_changed_at: string | null
}

export type ControlPanelSession = {
  kind: 'control_panel_session'
  email: string
  exp: number
}

export type ControlPanelSetupSession = {
  kind: 'control_panel_setup'
  email: string
  exp: number
}

function serviceHeaders(extra?: Record<string, string>) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SERVICE_KEY)
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url')
}

function signingSecret() {
  if (SESSION_SECRET) return SESSION_SECRET
  if (BOOTSTRAP_HASH) return createHash('sha256').update(BOOTSTRAP_HASH).digest('hex')
  return ''
}

function signPayload(payload: ControlPanelSession | ControlPanelSetupSession) {
  const secret = signingSecret()
  if (!secret) throw new Error('Control Panel session secret is not configured.')

  const encoded = base64url(JSON.stringify(payload))
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

function verifySignedPayload<T extends ControlPanelSession | ControlPanelSetupSession>(token: string, expectedKind: T['kind']) {
  const secret = signingSecret()
  if (!secret) return null

  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  const expected = createHmac('sha256', secret).update(encoded).digest('base64url')
  const providedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) return null

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as T
    if (payload.kind !== expectedKind) return null
    if (!payload.exp || payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function createControlPanelSession(email: string) {
  return signPayload({
    kind: 'control_panel_session',
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })
}

export function createControlPanelSetupSession(email: string) {
  return signPayload({
    kind: 'control_panel_setup',
    email,
    exp: Math.floor(Date.now() / 1000) + SETUP_TTL_SECONDS,
  })
}

export function verifyControlPanelSessionToken(token: string) {
  return verifySignedPayload<ControlPanelSession>(token, 'control_panel_session')
}

export function verifyControlPanelSetupToken(token: string) {
  return verifySignedPayload<ControlPanelSetupSession>(token, 'control_panel_setup')
}

export function validateNewOwnerPassword(password: string) {
  if (password.length < 14) return 'Use at least 14 characters.'
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Use uppercase, lowercase, and at least one number.'
  }
  return null
}

export async function hashOwnerPassword(password: string) {
  const salt = randomBytes(16).toString('base64url')
  const derived = await scrypt(password, salt, 64) as Buffer
  return `scrypt:v1:${salt}:${derived.toString('base64url')}`
}

export async function verifyOwnerPassword(password: string, storedHash: string) {
  const [algorithm, version, salt, hash] = storedHash.split(':')
  if (algorithm !== 'scrypt' || version !== 'v1' || !salt || !hash) return false

  const derived = await scrypt(password, salt, 64) as Buffer
  const expected = Buffer.from(hash, 'base64url')
  return expected.length === derived.length && timingSafeEqual(expected, derived)
}

export async function getStoredControlPanelCredential() {
  if (!hasSupabaseConfig()) return null

  const res = await fetch(`${SUPABASE_URL}/rest/v1/control_panel_credentials?id=eq.owner&select=id,password_hash,password_changed_at&limit=1`, {
    headers: serviceHeaders(),
    cache: 'no-store',
  })

  if (res.status === 404) return null

  if (!res.ok) {
    throw new Error(`Control Panel credential lookup failed with ${res.status}.`)
  }

  const rows = await res.json() as CredentialRow[]
  return rows[0] ?? null
}

export async function saveControlPanelPassword(password: string) {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase service credentials are not configured.')
  }

  const passwordHash = await hashOwnerPassword(password)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/control_panel_credentials?on_conflict=id`, {
    method: 'POST',
    headers: serviceHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    cache: 'no-store',
    body: JSON.stringify({
      id: 'owner',
      password_hash: passwordHash,
      password_changed_at: new Date().toISOString(),
    }),
  })

  if (!res.ok) {
    throw new Error(`Control Panel password save failed with ${res.status}.`)
  }
}

export async function verifyBootstrapPassword(password: string) {
  if (!BOOTSTRAP_HASH) return false
  return verifyOwnerPassword(password, BOOTSTRAP_HASH)
}

import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scrypt = promisify(scryptCallback)

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').trim()
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? '').trim()
const SESSION_SECRET = (process.env.CONTROL_PANEL_SESSION_SECRET ?? process.env.SUPABASE_JWT_SECRET ?? '').trim()
const SETUP_TOKEN = (process.env.CONTROL_PANEL_SETUP_TOKEN ?? '').trim()
const SESSION_TTL_SECONDS = 60 * 60 * 8
const RESET_TTL_SECONDS = 60 * 30

export type CredentialRow = {
  id: 'owner'
  username: string
  recovery_email: string
  password_hash: string
  password_changed_at: string | null
}

type ControlPanelSession = {
  kind: 'control_panel_session'
  username: string
  exp: number
}

type ControlPanelResetSession = {
  kind: 'control_panel_reset'
  username: string
  recoveryEmail: string
  passwordFingerprint: string
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

function isProductionRuntime() {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url')
}

function signingSecret() {
  if (SESSION_SECRET) return SESSION_SECRET
  return ''
}

export function isControlPanelSetupTokenRequired() {
  return isProductionRuntime() || Boolean(SETUP_TOKEN)
}

export function verifyControlPanelSetupToken(token: string) {
  if (!isControlPanelSetupTokenRequired()) return true
  if (!SETUP_TOKEN || !token) return false

  const expected = Buffer.from(SETUP_TOKEN)
  const provided = Buffer.from(token)
  return expected.length === provided.length && timingSafeEqual(expected, provided)
}

function signPayload(payload: ControlPanelSession | ControlPanelResetSession) {
  const secret = signingSecret()
  if (!secret) throw new Error('Control Panel session secret is not configured.')

  const encoded = base64url(JSON.stringify(payload))
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

function verifySignedPayload<T extends ControlPanelSession | ControlPanelResetSession>(token: string, expectedKind: T['kind']) {
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

export function createControlPanelSession(username: string) {
  return signPayload({
    kind: 'control_panel_session',
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })
}

export function verifyControlPanelSessionToken(token: string) {
  return verifySignedPayload<ControlPanelSession>(token, 'control_panel_session')
}

function credentialFingerprint(credential: Pick<CredentialRow, 'password_hash'>) {
  return createHash('sha256').update(credential.password_hash).digest('base64url')
}

export function createControlPanelResetToken(credential: CredentialRow) {
  return signPayload({
    kind: 'control_panel_reset',
    username: credential.username,
    recoveryEmail: credential.recovery_email,
    passwordFingerprint: credentialFingerprint(credential),
    exp: Math.floor(Date.now() / 1000) + RESET_TTL_SECONDS,
  })
}

export function verifyControlPanelResetToken(token: string, credential: CredentialRow) {
  const reset = verifySignedPayload<ControlPanelResetSession>(token, 'control_panel_reset')
  if (!reset) return null
  if (reset.username !== credential.username) return null
  if (reset.recoveryEmail.toLowerCase() !== credential.recovery_email.toLowerCase()) return null
  if (reset.passwordFingerprint !== credentialFingerprint(credential)) return null
  return reset
}

export function validateOwnerUsername(username: string) {
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
    return 'Use 3-40 letters, numbers, dots, underscores, or hyphens for the username.'
  }
  return null
}

export function validateRecoveryEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid recovery email.'
  return null
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

  let res: Response
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/control_panel_credentials?id=eq.owner&select=id,username,recovery_email,password_hash,password_changed_at&limit=1`, {
      headers: serviceHeaders(),
      cache: 'no-store',
    })
  } catch {
    throw new Error('Control Panel credential storage is unreachable. Check the Supabase project URL/status and apply the control_panel_credentials migration.')
  }

  if (res.status === 404) return null

  if (!res.ok) {
    throw new Error(`Control Panel credential lookup failed with ${res.status}. Apply the control_panel_credentials migration if it has not been applied.`)
  }

  const rows = await res.json() as CredentialRow[]
  return rows[0] ?? null
}

export async function saveControlPanelCredential(input: { username: string; password: string; recoveryEmail: string }) {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase service credentials are not configured.')
  }

  const passwordHash = await hashOwnerPassword(input.password)
  let res: Response
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/control_panel_credentials?on_conflict=id`, {
      method: 'POST',
      headers: serviceHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
      cache: 'no-store',
      body: JSON.stringify({
        id: 'owner',
        username: input.username.trim(),
        recovery_email: input.recoveryEmail.trim().toLowerCase(),
        password_hash: passwordHash,
        password_changed_at: new Date().toISOString(),
      }),
    })
  } catch {
    throw new Error('Control Panel credential storage is unreachable. Check the Supabase project URL/status before saving the permanent password.')
  }

  if (!res.ok) {
    throw new Error(`Control Panel password save failed with ${res.status}. Apply the control_panel_credentials migration if it has not been applied.`)
  }
}

export async function saveControlPanelPassword(password: string) {
  const credential = await getStoredControlPanelCredential()
  if (!credential) throw new Error('Control Panel owner has not been created yet.')
  await saveControlPanelCredential({
    username: credential.username,
    recoveryEmail: credential.recovery_email,
    password,
  })
}

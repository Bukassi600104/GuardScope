import { decodeJwt } from './quota'

const DEFAULT_OWNER_EMAIL = 'bukassi@gmail.com'

export function controlPanelOwnerEmails() {
  return (process.env.CONTROL_PANEL_OWNER_EMAILS ?? process.env.ADMIN_EMAILS ?? DEFAULT_OWNER_EMAIL)
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isControlPanelOwnerEmail(email?: string | null) {
  if (!email) return false
  return controlPanelOwnerEmails().includes(email.trim().toLowerCase())
}

export async function verifyControlPanelBearer(authHeader: string | null) {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return null

  const jwt = await decodeJwt(token)
  if (!jwt?.sub || !isControlPanelOwnerEmail(jwt.email)) return null

  return {
    userId: jwt.sub,
    email: jwt.email ?? '',
  }
}

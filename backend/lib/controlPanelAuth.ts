import { verifyControlPanelSessionToken } from './controlPanelPassword'

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

  const session = verifyControlPanelSessionToken(token)
  if (!session || !isControlPanelOwnerEmail(session.email)) return null

  return {
    email: session.email,
  }
}

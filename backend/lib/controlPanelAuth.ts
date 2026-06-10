import { verifyControlPanelSessionToken } from './controlPanelPassword'

export async function verifyControlPanelBearer(authHeader: string | null) {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return null

  const session = verifyControlPanelSessionToken(token)
  if (!session?.username) return null

  return {
    username: session.username,
  }
}

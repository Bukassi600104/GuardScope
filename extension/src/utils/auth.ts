// GuardScope Auth Utils — Phase 1 placeholder
// Full implementation in Phase 3 (Supabase Auth + JWT management)

export interface AuthState {
  isAuthenticated: boolean
  userId: string | null
  email: string | null
  tier: 'free' | 'pro' | 'team'
  token: string | null
  refreshToken?: string | null
  tokenExpiresAt?: number | null  // unix ms
}

const DEFAULT_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  userId: null,
  email: null,
  tier: 'free',
  token: null,
}

export async function getAuthState(): Promise<AuthState> {
  try {
    const result = await chrome.storage.local.get(['guardscope_auth'])
    if (result.guardscope_auth) {
      return result.guardscope_auth as AuthState
    }
    return DEFAULT_AUTH_STATE
  } catch {
    return DEFAULT_AUTH_STATE
  }
}

export async function setAuthState(state: AuthState): Promise<void> {
  await chrome.storage.local.set({ guardscope_auth: state })
}

export async function clearAuthState(): Promise<void> {
  await chrome.storage.local.remove(['guardscope_auth'])
}

export async function getToken(): Promise<string | null> {
  const state = await getAuthState()
  return state.token
}

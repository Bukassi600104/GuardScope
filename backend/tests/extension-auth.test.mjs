import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const signinRoute = readFileSync(new URL('../app/api/auth/signin/route.ts', import.meta.url), 'utf8')
const refreshRoute = readFileSync(new URL('../app/api/auth/refresh/route.ts', import.meta.url), 'utf8')

test('extension sign-in receives session fields without changing website sign-in', () => {
  assert.match(signinRoute, /client\?: string/)
  assert.match(signinRoute, /body\.client === 'extension'/)
  assert.match(signinRoute, /access_token/)
  assert.match(signinRoute, /refresh_token/)
  assert.match(signinRoute, /getUserTier/)
  assert.match(signinRoute, /return NextResponse\.json\(\{ success: true \}/)
})

test('extension token refresh is proxied through backend', () => {
  assert.match(refreshRoute, /grant_type=refresh_token/)
  assert.match(refreshRoute, /refresh_token/)
  assert.match(refreshRoute, /getUserTier/)
  assert.match(refreshRoute, /Session expired/)
})

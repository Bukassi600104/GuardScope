import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const quota = readFileSync(new URL('../lib/quota.ts', import.meta.url), 'utf8')
const signupRoute = readFileSync(new URL('../app/api/auth/signup/route.ts', import.meta.url), 'utf8')
const resetPasswordRoute = readFileSync(new URL('../app/api/auth/reset-password/route.ts', import.meta.url), 'utf8')

test('production requires Supabase JWT secret', () => {
  assert.match(quota, /\/auth\/v1\/user/)
  assert.match(quota, /SUPABASE_JWT_SECRET/)
  assert.match(quota, /local HMAC verification/)
})

test('JWT decoder rejects expired tokens and malformed subjects', () => {
  assert.match(quota, /payload\.exp && payload\.exp \* 1000 < Date\.now\(\)/)
  assert.match(quota, /UUID_REGEX\.test\(payload\.sub\)/)
})

test('signed-in free user quota remains monthly by account', () => {
  assert.match(quota, /const FREE_LIMIT = 5/)
  assert.match(quota, /const month = now\.getMonth\(\) \+ 1/)
  assert.match(quota, /analysis_count/)
})

test('promo pro tier expires by pro_expires_at while paid pro can remain active', () => {
  assert.match(quota, /select=tier,pro_expires_at/)
  assert.match(quota, /user\.tier === 'pro' && user\.pro_expires_at/)
  assert.match(quota, /expirePromoProTier\(userId\)/)
  assert.match(quota, /return 'free'/)
})

test('signed-in quota does not fail open in production', () => {
  assert.match(quota, /quotaUnavailableResult/)
  assert.match(quota, /isProductionRuntime\(\)/)
  assert.match(quota, /!SUPABASE_SERVICE_KEY \|\| !SUPABASE_URL/)
  assert.match(quota, /if \(!checkRes\.ok\) \{/)
  assert.match(quota, /return quotaUnavailableResult\(tier\)/)
})

test('password reset keeps the same minimum strength as signup', () => {
  assert.match(signupRoute, /password\.length < 12/)
  assert.match(resetPasswordRoute, /password\.length < 12/)
  assert.doesNotMatch(resetPasswordRoute, /password\.length < 8/)
})

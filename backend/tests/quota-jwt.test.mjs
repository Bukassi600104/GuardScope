import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const quota = readFileSync(new URL('../lib/quota.ts', import.meta.url), 'utf8')
const signupRoute = readFileSync(new URL('../app/api/auth/signup/route.ts', import.meta.url), 'utf8')
const resetPasswordRoute = readFileSync(new URL('../app/api/auth/reset-password/route.ts', import.meta.url), 'utf8')
const resetPasswordPage = readFileSync(new URL('../app/reset-password/page.tsx', import.meta.url), 'utf8')
const deleteUserRoute = readFileSync(new URL('../app/api/user/delete/route.ts', import.meta.url), 'utf8')
const analyzeRoute = readFileSync(new URL('../app/api/analyze/route.ts', import.meta.url), 'utf8')
const signupPage = readFileSync(new URL('../app/signup/page.tsx', import.meta.url), 'utf8')

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
  assert.match(quota, /const created = await upsertUsageRow\(userId, month, year\)/)
  assert.match(quota, /if \(!created && isProductionRuntime\(\)\) return quotaUnavailableResult\(tier\)/)
  assert.match(quota, /Promise<boolean>/)
  assert.match(quota, /return res\.ok/)
})

test('anonymous quota is enforced even when IP is bucketed as unknown', () => {
  assert.match(analyzeRoute, /const ip = \/\^\[0-9a-fA-F\.:\]\{3,45\}\$\/\.test\(rawIp\) \? rawIp : 'unknown'/)
  assert.match(analyzeRoute, /const quota = await checkAnonFreeQuota\(ip\)/)
  assert.doesNotMatch(analyzeRoute, /if \(ip !== 'unknown'\)\s*\{\s*const quota = await checkAnonFreeQuota\(ip\)/)
})

test('password reset keeps the same minimum strength as signup', () => {
  assert.match(signupRoute, /password\.length < 12/)
  assert.match(resetPasswordRoute, /password\.length < 12/)
  assert.match(resetPasswordPage, /password\.length < 12/)
  assert.match(resetPasswordPage, /minLength=\{12\}/)
  assert.doesNotMatch(resetPasswordRoute, /password\.length < 8/)
  assert.doesNotMatch(resetPasswordPage, /Password must be at least 8 characters|At least 8 characters|minLength=\{8\}/)
})

test('public signup does not auto-confirm accounts unless explicitly enabled', () => {
  assert.match(signupRoute, /AUTH_AUTO_CONFIRM_SIGNUP/)
  assert.match(signupRoute, /AUTO_CONFIRM_SIGNUP && SUPABASE_SERVICE_KEY/)
  assert.doesNotMatch(signupRoute, /if \(SUPABASE_SERVICE_KEY\) \{/)
  assert.match(signupRoute, /needsConfirmation: false/)
  assert.match(signupRoute, /const needsConfirmation = !data\.id/)
})

test('signup page shows confirmation-specific guidance when needed', () => {
  assert.match(signupPage, /signupNeedsConfirmation/)
  assert.match(signupPage, /Boolean\(data\.needsConfirmation\)/)
  assert.match(signupPage, /Confirm your email from your inbox/)
})

test('account deletion removes auth user before best-effort row cleanup', () => {
  assert.match(deleteUserRoute, /auth\/v1\/admin\/users\/\$\{userId\}/)
  assert.match(deleteUserRoute, /Promise\.allSettled/)
  assert.match(deleteUserRoute, /Best-effort cleanup/)
  assert.match(deleteUserRoute, /avoids leaving an auth/)
})

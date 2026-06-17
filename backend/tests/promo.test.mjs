import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const promo = readFileSync(new URL('../lib/promo.ts', import.meta.url), 'utf8')
const validateRoute = readFileSync(new URL('../app/api/promo/validate/route.ts', import.meta.url), 'utf8')
const requestRoute = readFileSync(new URL('../app/api/promo/request/route.ts', import.meta.url), 'utf8')
const homePage = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const launchCodeForm = readFileSync(new URL('../app/components/LaunchCodeForm.tsx', import.meta.url), 'utf8')
const promoAbuse = readFileSync(new URL('../lib/promoAbuse.ts', import.meta.url), 'utf8')
const rateLimit = readFileSync(new URL('../lib/ratelimit.ts', import.meta.url), 'utf8')
const dbRateLimit = readFileSync(new URL('../lib/dbRateLimit.ts', import.meta.url), 'utf8')
const cors = readFileSync(new URL('../lib/cors.ts', import.meta.url), 'utf8')
const abuseMigration = readFileSync(new URL('../supabase/migrations/20260615203641_abuse_controls.sql', import.meta.url), 'utf8')
const grantMigration = readFileSync(new URL('../supabase/migrations/20260615232425_tighten_public_table_grants.sql', import.meta.url), 'utf8')
const rlsFunctionHardeningMigration = readFileSync(new URL('../supabase/migrations/20260616090216_harden_rls_and_function_privileges.sql', import.meta.url), 'utf8')
const rebuildSql = readFileSync(new URL('../supabase/guardscope_rebuild.sql', import.meta.url), 'utf8')
const legacyUpgradeRoute = readFileSync(new URL('../app/api/upgrade/route.ts', import.meta.url), 'utf8')

test('promo assignment retries and guards concurrent claims', () => {
  assert.match(promo, /for \(let attempt = 0; attempt < 3; attempt\+\+\)/)
  assert.match(promo, /status=eq\.unused&requester_email=is\.null/)
})

test('promo redemption requires authenticated matching account', () => {
  assert.match(validateRoute, /decodeJwt\(token\)/)
  assert.match(validateRoute, /jwt\.email\.toLowerCase\(\) !== email\.toLowerCase\(\)/)
  assert.match(validateRoute, /status: 403/)
  assert.match(promo, /This launch code belongs to a different email address/)
  assert.match(promo, /requester_email=eq/)
})

test('promo redemption distinguishes active promo, expired promo, and paid pro', () => {
  assert.match(promo, /select=id,tier,pro_expires_at/)
  assert.match(promo, /activePromoPro/)
  assert.match(promo, /paidOrTeamPro/)
  assert.match(promo, /new Date\(user\.pro_expires_at\) > new Date\(\)/)
})

test('promo routes use guardscope.app support address', () => {
  assert.doesNotMatch(promo, /guardscope\.io/)
  assert.doesNotMatch(requestRoute, /guardscope\.io/)
  assert.match(promo, /support@guardscope\.app/)
})

test('homepage launch code form stays on-page and collects required fields', () => {
  assert.match(homePage, /<LaunchCodeForm \/>/)
  assert.doesNotMatch(homePage, /action="\/api\/promo\/request"/)
  assert.match(launchCodeForm, /fetch\('\/api\/promo\/request'/)
  assert.match(launchCodeForm, /country/)
  assert.match(requestRoute, /Launch-code claims are temporarily unavailable/)
  assert.match(requestRoute, /database lookup failed/)
  assert.match(requestRoute, /PROMO_BROWSER_CODE_FALLBACK/)
  assert.match(requestRoute, /emailDelivered \|\| !ALLOW_BROWSER_CODE_FALLBACK \? \{\} : \{ code: promoCode\.code \}/)
  assert.doesNotMatch(requestRoute, /success: true,\s*code: promoCode\.code/)
  assert.match(launchCodeForm, /navigator\.clipboard\.writeText\(code\)/)
  assert.match(launchCodeForm, /Your launch code/)
})

test('promo requests use bot traps and server-side abuse telemetry', () => {
  assert.match(requestRoute, /guardPromoRequest/)
  assert.match(requestRoute, /guardPromoResend/)
  assert.match(requestRoute, /promo_request_blocked/)
  assert.match(requestRoute, /promo_resend_blocked/)
  assert.match(requestRoute, /If a launch code is assigned to that email/)
  assert.match(launchCodeForm, /name="company"/)
  assert.match(launchCodeForm, /startedAt/)
  assert.match(promoAbuse, /promo_claim_attempts/)
  assert.match(promoAbuse, /honeypot/)
  assert.match(promoAbuse, /disposable_email/)
  assert.match(promoAbuse, /ip_daily_code_limit/)
  assert.match(promoAbuse, /email_already_requested/)
  assert.match(promoAbuse, /guardPromoResend/)
  assert.match(promoAbuse, /email_resend_daily_limit/)
  assert.match(promoAbuse, /ip_resend_daily_limit/)
  assert.match(promoAbuse, /resend_allowed/)
  assert.doesNotMatch(promoAbuse, /ip_address|raw_ip|requester_ip[^_]/)
  assert.match(promo, /requester_ip_hash/)
  assert.match(promo, /assigned_at/)
})

test('rate limits do not fail open in production when Redis is missing', () => {
  assert.match(rateLimit, /checkDbRateLimit/)
  assert.match(rateLimit, /productionLimiterUnavailableResult/)
  assert.doesNotMatch(rateLimit, /Redis unreachable[\s\S]*allowed: true/)
  assert.match(dbRateLimit, /api_rate_events/)
  assert.match(dbRateLimit, /securityHash/)
})

test('CORS only allows the published extension in production', () => {
  assert.match(cors, /fbjajjiepjmcmkcidfbmjbjmmegokhif/)
  assert.match(cors, /allowedExtensionOrigins/)
  assert.match(cors, /CANONICAL_SITE_ORIGIN = 'https:\/\/guardscope\.app'/)
  assert.match(cors, /allowedWebsiteOrigins\(\)\.has\(origin\)/)
  assert.match(cors, /return allowedExtensionOrigins\(\)\.has\(origin\) \? origin : 'null'/)
  assert.doesNotMatch(cors, /origin\.startsWith\('chrome-extension:\/\/'\) return origin/)
})

test('abuse migration stores hashed telemetry behind RLS', () => {
  assert.match(abuseMigration, /create table if not exists public\.api_rate_events/)
  assert.match(abuseMigration, /create table if not exists public\.promo_claim_attempts/)
  assert.match(abuseMigration, /identifier_hash text not null/)
  assert.match(abuseMigration, /email_hash text not null/)
  assert.match(abuseMigration, /ip_hash text not null/)
  assert.match(abuseMigration, /alter table public\.promo_claim_attempts enable row level security/)
  assert.match(abuseMigration, /revoke all on public\.promo_claim_attempts from anon, authenticated/)
  assert.doesNotMatch(abuseMigration, / raw_ip | ip_address | email text not null/)
})

test('legacy upgrade endpoint is suspended and uses restricted CORS', () => {
  assert.match(legacyUpgradeRoute, /payments_suspended/)
  assert.match(legacyUpgradeRoute, /buildCorsHeaders\(req\)/)
  assert.doesNotMatch(legacyUpgradeRoute, /Access-Control-Allow-Origin': '\*'/)
  assert.doesNotMatch(legacyUpgradeRoute, /transaction\/initialize/)
})

test('public Supabase table access is read-only where clients need it', () => {
  assert.match(grantMigration, /drop policy if exists "own_history"/)
  assert.match(grantMigration, /for select\s+to authenticated\s+using \(auth\.uid\(\) = user_id\)/)
  assert.match(grantMigration, /revoke all on table public\.analysis_history from anon/)
  assert.match(grantMigration, /revoke insert, update, delete[\s\S]*public\.analysis_history from authenticated/)
  assert.match(grantMigration, /revoke all on table public\.promo_codes from anon, authenticated/)
  assert.match(grantMigration, /drop policy if exists "Service can insert users"/)
  assert.match(grantMigration, /to service_role/)
})

test('Supabase recovery SQL keeps hardened RLS and function privileges', () => {
  for (const sql of [rlsFunctionHardeningMigration, rebuildSql]) {
    assert.match(sql, /revoke all on table public\.teams from anon/)
    assert.match(sql, /revoke all on table public\.team_members from anon/)
    assert.match(sql, /revoke (all|execute) on function public\.handle_new_user\(\) from public, anon, authenticated/)
    assert.match(sql, /create policy "service_role_all"[\s\S]*to service_role[\s\S]*using \(true\)/)
    assert.doesNotMatch(sql, /auth\.role\(\) = 'service_role'/)
    assert.doesNotMatch(sql, /for all using \(owner_id = auth\.uid\(\)\)/)
  }
})

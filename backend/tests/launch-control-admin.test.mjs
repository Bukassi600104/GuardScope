import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const statusRoute = readFileSync(new URL('../app/api/control-panel/status/route.ts', import.meta.url), 'utf8')
const sessionRoute = readFileSync(new URL('../app/api/control-panel/session/route.ts', import.meta.url), 'utf8')
const passwordRoute = readFileSync(new URL('../app/api/control-panel/password/route.ts', import.meta.url), 'utf8')
const setupRoute = readFileSync(new URL('../app/api/control-panel/setup/route.ts', import.meta.url), 'utf8')
const recoverRoute = readFileSync(new URL('../app/api/control-panel/recover/route.ts', import.meta.url), 'utf8')
const page = readFileSync(new URL('../app/control-panel/page.tsx', import.meta.url), 'utf8')
const legacyPage = readFileSync(new URL('../app/launch-control/page.tsx', import.meta.url), 'utf8')
const launch = readFileSync(new URL('../lib/launch.ts', import.meta.url), 'utf8')
const auth = readFileSync(new URL('../lib/controlPanelAuth.ts', import.meta.url), 'utf8')
const password = readFileSync(new URL('../lib/controlPanelPassword.ts', import.meta.url), 'utf8')
const ownerOperations = readFileSync(new URL('../lib/ownerOperations.ts', import.meta.url), 'utf8')
const credentialMigration = readFileSync(new URL('../supabase/migrations/006_control_panel_credentials.sql', import.meta.url), 'utf8')
const operationalEventsMigration = readFileSync(new URL('../supabase/migrations/007_operational_events.sql', import.meta.url), 'utf8')

test('control panel is owner-gated and read-only', () => {
  assert.match(statusRoute, /verifyControlPanelBearer/)
  assert.match(sessionRoute, /verifyOwnerPassword/)
  assert.match(passwordRoute, /saveControlPanelPassword/)
  assert.match(auth, /verifyControlPanelSessionToken/)
  assert.doesNotMatch(page, /LAUNCH_CONTROL_PASSWORD/)
  assert.doesNotMatch(page, /method:\s*['"]DELETE['"]/)
  assert.doesNotMatch(page, /method:\s*['"]PATCH['"]/)
})

test('control panel supports first-time owner setup and password recovery', () => {
  assert.match(setupRoute, /saveControlPanelCredential/)
  assert.match(setupRoute, /recoveryEmail/)
  assert.match(sessionRoute, /setupRequired/)
  assert.match(recoverRoute, /sendControlPanelRecoveryEmail/)
  assert.match(passwordRoute, /verifyControlPanelResetToken/)
  assert.match(password, /scrypt:v1/)
  assert.match(password, /control_panel_credentials/)
  assert.match(page, /Create owner/)
  assert.match(page, /Forgot password\?/)
  assert.match(page, /Recovery email/)
  assert.match(page, /Change password/)
  assert.match(credentialMigration, /create table if not exists public\.control_panel_credentials/)
  assert.match(credentialMigration, /username text not null/)
  assert.match(credentialMigration, /recovery_email text not null/)
  assert.match(credentialMigration, /revoke all on table public\.control_panel_credentials from anon, authenticated/)
})

test('control panel reports owner operations metrics', () => {
  assert.match(statusRoute, /getOwnerOperationsSnapshot/)
  assert.match(ownerOperations, /promoSummary/)
  assert.match(ownerOperations, /userSummary/)
  assert.match(ownerOperations, /analysisSummary/)
  assert.match(ownerOperations, /recentHighRisk/)
  assert.match(ownerOperations, /issueSummary/)
  assert.match(ownerOperations, /trend14d/)
  assert.match(ownerOperations, /riskDistribution/)
  assert.match(operationalEventsMigration, /create table if not exists public\.operational_events/)
  assert.match(operationalEventsMigration, /revoke all on table public\.operational_events from anon, authenticated/)
})

test('control panel page renders owner dashboard sections', () => {
  assert.match(page, /Control Center/)
  assert.match(page, /Owner-only operating view/)
  assert.match(page, /Chrome Web Store installs/)
  assert.match(page, /Issues and bugs/)
  assert.match(page, /Promo codes/)
  assert.match(page, /Scan analytics/)
  assert.match(page, /High-risk scans/)
  assert.match(page, /Recent accounts/)
  assert.match(page, /Data handling/)
})

test('legacy launch control page redirects to control panel', () => {
  assert.match(legacyPage, /redirect\('\/control-panel'\)/)
})

test('launch config uses corrected Chrome Web Store URL', () => {
  assert.match(launch, /fbjajjiepjmcmkcidfbmjbjmmegokhif/)
  assert.doesNotMatch(launch, /fbjajijepjmcmkcidfbmjbjmmegokhif/)
  assert.doesNotMatch(page, /fbjajijepjmcmkcidfbmjbjmmegokhif/)
})
